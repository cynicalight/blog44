import { normalizePrefix } from './core'

export type CosConfig = {
  bucket: string
  region: string
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
  'TENCENT_COS_PREFIX',
  'TENCENT_COS_PUBLIC_BASE_URL',
] as const

const SECRET_VARIABLES = ['TENCENT_COS_SECRET_ID', 'TENCENT_COS_SECRET_KEY'] as const

function getValue(environment: Record<string, string | undefined>, name: string) {
  return environment[name]?.trim() || ''
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
  const prefix = normalizePrefix(getValue(environment, 'TENCENT_COS_PREFIX'))
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
