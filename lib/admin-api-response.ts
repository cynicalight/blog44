function getNonJsonErrorMessage(response: Response, fallbackMessage: string) {
  if (response.status === 413) {
    return '图片上传请求超过服务器限制，请压缩图片后重试。'
  }
  if (response.status === 504) {
    return '图片上传超时，请稍后重试。'
  }
  if (response.status === 401) {
    return '登录状态已失效，请重新登录。'
  }
  return `${fallbackMessage}（HTTP ${response.status}）`
}

export async function readAdminApiResponse<T>(response: Response, fallbackMessage: string) {
  const responseText = await response.text()
  let data: unknown

  try {
    data = JSON.parse(responseText)
  } catch {
    if (!response.ok) {
      throw new Error(getNonJsonErrorMessage(response, fallbackMessage))
    }
    throw new Error(`${fallbackMessage}：服务器响应格式不正确。`)
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : fallbackMessage
    throw new Error(message)
  }

  return data as T
}
