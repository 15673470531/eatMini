/**
 * 接口请求封装
 * 统一响应格式：{ code: 0, msg: 'success', data: ... }，code = 0 才算成功
 */

const app = getApp()

/**
 * 发起请求
 * @param {string} path   /api 之后的路径，如 'user/login'
 * @param {object} options { method, data, silent }
 * @return {Promise<data>}  resolve 业务 data，reject { code, msg }
 */
function request(path, options = {}) {
  const { method = 'GET', data = {} } = options

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.baseUrl}/api/${path}`,
      method,
      data,
      header: {
        'content-type': 'application/json',
        ...(app.globalData.token ? { Authorization: `Bearer ${app.globalData.token}` } : {})
      },
      success(res) {
        const body = res.data || {}

        // 401：登录态失效，清掉本地 token，由页面决定是否引导登录
        if (res.statusCode === 401) {
          app.clearLogin()
          reject({ code: 401, msg: '登录已失效' })
          return
        }

        if (body.code === 0) {
          resolve(body.data)
        } else {
          reject({ code: body.code, msg: body.msg || '请求失败' })
        }
      },
      fail() {
        reject({ code: -1, msg: '网络异常，请稍后重试' })
      }
    })
  })
}

module.exports = {
  request,
  get: (path, data) => request(path, { method: 'GET', data }),
  post: (path, data) => request(path, { method: 'POST', data })
}
