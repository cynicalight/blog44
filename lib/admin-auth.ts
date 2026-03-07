import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import { ADMIN_SESSION_COOKIE } from '~/lib/admin-auth-constants'
import type { AdminSessionUser } from '~/types/admin'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const PBKDF2_PREFIX = 'pbkdf2_sha256'

type SessionPayload = {
  email: string
  exp: number
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(`${normalized}${padding}`, 'base64')
}

function signPayload(encodedPayload: string) {
  const secret = getRequiredEnv('AUTH_SECRET')
  return toBase64Url(createHmac('sha256', secret).update(encodedPayload).digest())
}

function parsePasswordHash(value: string) {
  const normalized = value
    .trim()
    .replace(/^"(.+)"$/, '$1')
    .replace(/^'(.+)'$/, '$1')
    .replace(/\\\$/g, '$')

  const [algorithm, iterations, salt, hash] = normalized.split('$')
  if (algorithm !== PBKDF2_PREFIX || !iterations || !salt || !hash) {
    throw new Error('ADMIN_PASSWORD_HASH must use pbkdf2_sha256$iterations$salt$hash format')
  }
  return {
    iterations: Number(iterations),
    salt,
    hash,
  }
}

export function hashAdminPassword(password: string, iterations = 210000) {
  if (!password) {
    throw new Error('password is required')
  }
  const salt = randomBytes(16).toString('hex')
  const derived = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex')
  return `${PBKDF2_PREFIX}$${iterations}$${salt}$${derived}`
}

export function verifyAdminPassword(password: string) {
  const email = getRequiredEnv('ADMIN_EMAIL')
  const passwordHash = getRequiredEnv('ADMIN_PASSWORD_HASH')
  const { iterations, salt, hash } = parsePasswordHash(passwordHash)
  const derived = pbkdf2Sync(password, salt, iterations, 32, 'sha256')
  const expected = Buffer.from(hash, 'hex')
  if (derived.length !== expected.length) {
    return false
  }
  return timingSafeEqual(derived, expected) && email.length > 0
}

export function validateAdminCredentials(email: string, password: string): AdminSessionUser | null {
  const expectedEmail = getRequiredEnv('ADMIN_EMAIL')
  if (email !== expectedEmail) {
    return null
  }
  if (!verifyAdminPassword(password)) {
    return null
  }
  return { email: expectedEmail }
}

export function createAdminSessionToken(email: string) {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifyAdminSessionToken(token: string | undefined | null): AdminSessionUser | null {
  if (!token) {
    return null
  }
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signPayload(encodedPayload)
  const provided = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as SessionPayload
    if (!parsed.email || !parsed.exp || parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }
    return { email: parsed.email }
  } catch {
    return null
  }
}

export function getAdminSessionCookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  }
}
