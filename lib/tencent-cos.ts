export type CosConfig = {
  bucket: string
  region: string
  storageClass: 'STANDARD' | 'MAZ_STANDARD'
  prefix: string
  publicBaseUrl: string
  credentials: {
    secretId: string
    secretKey: string
    sessionToken?: string
  } | null
}

const PUBLIC_VARIABLES = [
  'TENCENT_COS_BUCKET',
  'TENCENT_COS_REGION',
  'TENCENT_COS_STORAGE_CLASS',
  'TENCENT_COS_PREFIX',
  'TENCENT_COS_PUBLIC_BASE_URL',
] as const

const SECRET_VARIABLES = ['TENCENT_COS_SECRET_ID', 'TENCENT_COS_SECRET_KEY'] as const

function getValue(environment: Record<string, string | undefined>, name: string) {
  return environment[name]?.trim() || ''
}

export function normalizeCosPrefix(prefix: string) {
  const normalized = prefix
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/')
  const segments = normalized.split('/').filter(Boolean)

  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('COS prefix cannot contain . or .. path segments')
  }

  return segments.join('/')
}

export function readCosConfig(
  environment: Record<string, string | undefined>,
  options: { requireCredentials: boolean }
): CosConfig {
  const requiredVariables = options.requireCredentials
    ? [...PUBLIC_VARIABLES, ...SECRET_VARIABLES]
    : [...PUBLIC_VARIABLES]
  const missingVariables = requiredVariables.filter((name) => !getValue(environment, name))

  if (missingVariables.length > 0) {
    throw new Error(`Missing COS environment variables: ${missingVariables.join(', ')}`)
  }

  const bucket = getValue(environment, 'TENCENT_COS_BUCKET')
  const region = getValue(environment, 'TENCENT_COS_REGION')
  const storageClass = getValue(environment, 'TENCENT_COS_STORAGE_CLASS')
  const prefix = normalizeCosPrefix(getValue(environment, 'TENCENT_COS_PREFIX'))
  const publicBaseUrl = getValue(environment, 'TENCENT_COS_PUBLIC_BASE_URL').replace(/\/+$/, '')
  const secretId = getValue(environment, 'TENCENT_COS_SECRET_ID')
  const secretKey = getValue(environment, 'TENCENT_COS_SECRET_KEY')
  const sessionToken = getValue(environment, 'TENCENT_COS_SESSION_TOKEN')

  if (!/^[a-z0-9][a-z0-9-]*-\d+$/.test(bucket)) {
    throw new Error('TENCENT_COS_BUCKET must include the APPID, for example bucket-1250000000')
  }

  if (!/^[a-z]+-[a-z0-9-]+$/.test(region)) {
    throw new Error('TENCENT_COS_REGION must be a COS region such as ap-guangzhou')
  }

  if (storageClass !== 'STANDARD' && storageClass !== 'MAZ_STANDARD') {
    throw new Error('TENCENT_COS_STORAGE_CLASS must be STANDARD or MAZ_STANDARD')
  }

  const parsedPublicUrl = new URL(publicBaseUrl)
  if (parsedPublicUrl.protocol !== 'https:') {
    throw new Error('TENCENT_COS_PUBLIC_BASE_URL must use HTTPS')
  }

  if (!options.requireCredentials && Boolean(secretId) !== Boolean(secretKey)) {
    throw new Error(
      'TENCENT_COS_SECRET_ID and TENCENT_COS_SECRET_KEY must either both be set or both be empty'
    )
  }

  return {
    bucket,
    region,
    storageClass,
    prefix,
    publicBaseUrl,
    credentials:
      secretId && secretKey
        ? {
            secretId,
            secretKey,
            ...(sessionToken ? { sessionToken } : {}),
          }
        : null,
  }
}

export function buildCosContentKey(sha256: string, extension: string) {
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error('Asset SHA-256 must be a 64-character lowercase hexadecimal string')
  }

  const normalizedExtension = extension.toLowerCase()
  if (!/^\.[a-z0-9]+$/.test(normalizedExtension)) {
    throw new Error(`Unsupported asset extension: ${extension}`)
  }

  return `${sha256.slice(0, 2)}/${sha256}${normalizedExtension}`
}

export function buildCosObjectKey(prefix: string, contentKey: string) {
  const normalizedPrefix = normalizeCosPrefix(prefix)
  return normalizedPrefix ? `${normalizedPrefix}/${contentKey}` : contentKey
}

export function buildCosPublicUrl(publicBaseUrl: string, objectKey: string) {
  const baseUrl = new URL(`${publicBaseUrl.replace(/\/+$/, '')}/`)
  if (baseUrl.protocol !== 'https:') {
    throw new Error('COS public base URL must use HTTPS')
  }

  const encodedKey = objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return new URL(encodedKey, baseUrl).toString()
}
