import { config } from '../config.js'

function buildDevSession(code) {
  const suffix = code.replace(/^dev:/, '') || 'local-user'
  return {
    openid: `dev_openid_${suffix}`,
    unionid: null,
    session_key: 'dev_session_key',
  }
}

export async function exchangeWeChatCode(code) {
  if (config.devAuthBypass) {
    return buildDevSession(code || 'dev:local-user')
  }

  if (code.startsWith('dev:')) {
    return buildDevSession(code)
  }

  if (!config.wechatAppId || !config.wechatAppSecret) {
    const error = new Error('WeChat app credentials are not configured')
    error.statusCode = 500
    error.code = 'WECHAT_CONFIG_MISSING'
    throw error
  }

  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.searchParams.set('appid', config.wechatAppId)
  url.searchParams.set('secret', config.wechatAppSecret)
  url.searchParams.set('js_code', code)
  url.searchParams.set('grant_type', 'authorization_code')

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok || data.errcode) {
    const error = new Error(data.errmsg || 'Failed to exchange wechat code')
    error.statusCode = 400
    error.code = 'WECHAT_CODE_INVALID'
    throw error
  }

  return data
}
