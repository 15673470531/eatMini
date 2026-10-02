const config = require('../config/api')
const KEY = 'eatwhat_auth_v1'
function baseUrl() {
  const version = typeof wx.getAccountInfoSync === 'function' ? wx.getAccountInfoSync().miniProgram.envVersion : 'develop'
  return version === 'develop' ? config.developmentBaseUrl : config.productionBaseUrl
}
function session() { try { const value = wx.getStorageSync(KEY); return value && value.server === baseUrl() ? value : null } catch (_) { return null } }
function clear() { wx.removeStorageSync(KEY) }
function networkError(failure, endpoint) {
  const detail = failure && failure.errMsg || 'request:fail（微信未返回具体原因）'
  let message = '暂时连接不上服务，请检查手机网络后重试'
  if (/domain list|合法域名|not in domain/i.test(detail)) message = '请求域名未获微信允许，请配置 request 合法域名后重新预览'
  else if (/ssl|tls|certificate|cert[_ :]|证书/i.test(detail)) message = 'HTTPS 连接校验失败，请检查服务器证书和证书链'
  else if (/timeout|timed out/i.test(detail)) message = '连接服务超时，请稍后重试'
  else if (/resolve|dns|name_not_resolved/i.test(detail)) message = '手机无法解析服务域名，请切换网络后重试'
  const error = new Error(message)
  error.network = true
  error.detail = detail
  error.endpoint = endpoint
  // 只记录地址和微信错误，不记录请求体、code、Token 或认证头。
  console.warn('[eatWhat network]', endpoint, detail)
  return error
}
function showError(error) {
  if (error.network && typeof wx.showModal === 'function') {
    wx.showModal({ title: '连接失败', content: error.message + '\n\n原因：' + error.detail + '\n地址：' + error.endpoint, showCancel: false, confirmText: '知道了' })
  } else wx.showToast({ title: error.message || '操作失败，请重试', icon: 'none' })
}
function request(path, method = 'GET', data = {}, current = session()) {
  const base = baseUrl()
  if (!base) return Promise.reject(new Error('登录服务尚未配置，请稍后再试'))
  return new Promise((resolve, reject) => wx.request({
    url: base.replace(/\/$/, '') + '/api' + path, method, data, timeout: 15000,
    header: { Accept: 'application/json', ...(current ? { Authorization: 'Bearer ' + current.token } : {}) },
    success(res) {
      if (res.statusCode === 401 && current && session() && session().token === current.token) clear()
      if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.code === 0) resolve(res.data.data)
      else { const error = new Error(res.data && (res.data.msg || res.data.message) || '请求失败，请稍后再试'); error.status = res.statusCode; reject(error) }
    }, fail(error) { reject(networkError(error, base.replace(/\/$/, '') + '/api' + path)) }
  }))
}
async function login() {
  const code = await new Promise((resolve, reject) => wx.login({ timeout: 10000, success: r => r.code ? resolve(r.code) : reject(new Error('微信登录失败，请重试')), fail: () => reject(new Error('微信登录未完成，请重试')) }))
  const data = await request('/user/login', 'POST', { code })
  if (!data || !data.token || !data.userId) throw new Error('登录信息异常，请重试')
  data.server = baseUrl()
  wx.setStorageSync(KEY, data)
  return data
}
// 头像地址后端只下发站点相对路径（/storage/xxx），这里按当前 baseUrl 拼成完整地址
function absoluteUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return baseUrl().replace(/\/$/, '') + (path.charAt(0) === '/' ? path : '/' + path)
}
// 上传 chooseAvatar 选出的头像（本机临时文件），成功后同步本地会话里的 avatarUrl
function uploadAvatar(filePath) {
  const current = session()
  if (!current) return Promise.reject(new Error('请先登录后再设置头像'))
  const url = baseUrl().replace(/\/$/, '') + '/api/user/avatar'
  return new Promise((resolve, reject) => wx.uploadFile({
    url, filePath, name: 'file', timeout: 20000,
    header: { Accept: 'application/json', Authorization: 'Bearer ' + current.token },
    success(res) {
      let body = null
      try { body = JSON.parse(res.data) } catch (_) { body = null }
      if (res.statusCode === 401 && session() && session().token === current.token) clear()
      if (res.statusCode >= 200 && res.statusCode < 300 && body && body.code === 0) {
        const value = Object.assign({}, session() || current, body.data)
        wx.setStorageSync(KEY, value)
        resolve(value)
      } else {
        const error = new Error(body && (body.msg || body.message) || '头像上传失败，请重试')
        error.status = res.statusCode
        reject(error)
      }
    },
    // 只记录地址和微信错误，不记录 Token 或请求头
    fail(error) { reject(networkError(error, url)) }
  }))
}
async function refresh() {
  const old = session(); if (!old) return null
  const data = await request('/user/info')
  if (!session() || session().token !== old.token) return session()
  const value = Object.assign({}, old, data); wx.setStorageSync(KEY, value); return value
}
async function logout() { await request('/user/logout', 'POST'); clear() }
module.exports = { session, login, refresh, logout, request, baseUrl, showError, absoluteUrl, uploadAvatar }
