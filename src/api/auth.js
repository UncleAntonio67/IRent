import { apiRequest, clearAccessToken, recordPublicAccountLogin as requestPublicAccountLogin, recordWeChatAccountLogin as requestWeChatAccountLogin, setAccessToken } from './client'

export async function loginWithWeChatCode(payload) {
  const result = await apiRequest('/auth/wechat/login', {
    method: 'POST',
    data: payload,
  })
  if (result?.token) setAccessToken(result.token)
  return result
}

export function fetchCurrentSession() {
  return apiRequest('/auth/me')
}

export function clearCloudSession() {
  clearAccessToken()
}

export function recordPublicAccountLogin() {
  return requestPublicAccountLogin()
}

export function recordWeChatAccountLogin() {
  return requestWeChatAccountLogin()
}
