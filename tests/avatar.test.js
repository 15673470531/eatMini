// 头像登录 / 更换流程测试：全部用假的 wx 接口，不发真实请求。
// 覆盖：未登录时选头像（先登录再上传）、已登录换头像、上传失败保留原头像、跳过头像登录、地址拼接、上传遇 401。
require('../config/api').developmentBaseUrl = 'http://127.0.0.1:8087'
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const auth = require('../utils/auth')
const kitchen = require('../utils/kitchen')
let stored, remote, uploads, upload, loginCount
const KEY = 'eatwhat_auth_v1'
// 复用 login-required 测试的页面装载方式：捕获 Page 定义并造一个可手动 setData 的实例
function page(name) {
 let definition
 global.Page = value => { definition = value }
 const path = require.resolve('../pages/' + name + '/' + name)
 delete require.cache[path]; require(path)
 const instance = Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)) })
 instance.setData = patch => Object.assign(instance.data, patch)
 return instance
}
// 后端 /user/login 与 /user/avatar 返回的用户资料（头像为站点相对路径）
function profile(avatarUrl) { return { isAdmin: false, userId: 1, nickName: '海豚用户', avatarUrl } }
beforeEach(() => {
 stored = {}; remote = kitchen.defaults(); uploads = []; loginCount = 0
 upload = { statusCode: 200, body: { code: 0, msg: '头像已更新', data: profile('/storage/avatars/new.jpg') } }
 global.wx = {
  getStorageSync: k => stored[k] && JSON.parse(JSON.stringify(stored[k])),
  setStorageSync: (k, v) => { stored[k] = JSON.parse(JSON.stringify(v)) },
  removeStorageSync: k => delete stored[k],
  showToast() {}, showLoading() {}, hideLoading() {}, setNavigationBarTitle() {}, navigateBack() {},
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
  showModal(o) { if (o.success) o.success({ confirm: true }) },
  login(o) { loginCount++; o.success({ code: 'actual-code' }) },
  request(o) {
   if (o.url.endsWith('/user/login')) { o.success({ statusCode: 200, data: { code: 0, data: Object.assign(profile(null), { token: 'token-1' }) } }); return }
   if (o.method === 'PUT') remote = JSON.parse(JSON.stringify(o.data.state))
   o.success({ statusCode: 200, data: { code: 0, data: { revision: 1, state: remote } } })
  },
  uploadFile(o) { uploads.push(o); o.success({ statusCode: upload.statusCode, data: JSON.stringify(upload.body) }) }
 }
})

test('未登录点头像：先完成微信登录，再把临时文件上传成账号头像', async () => {
 const p = page('mine')
 assert.equal(p.data.avatar, '')
 await p.chooseAvatar({ detail: { avatarUrl: 'wxfile://tmp_avatar.jpg' } })
 assert.equal(loginCount, 1)
 assert.equal(uploads.length, 1)
 assert.equal(uploads[0].filePath, 'wxfile://tmp_avatar.jpg')
 assert.equal(uploads[0].name, 'file')
 assert.equal(uploads[0].url, 'http://127.0.0.1:8087/api/user/avatar')
 assert.equal(uploads[0].header.Authorization, 'Bearer token-1')
 // 服务端返回的相对地址写回本地会话，并拼成完整地址显示
 assert.equal(auth.session().avatarUrl, '/storage/avatars/new.jpg')
 assert.equal(p.data.avatar, 'http://127.0.0.1:8087/storage/avatars/new.jpg')
 assert.equal(p.data.user.userId, 1)
})

test('已登录换头像：只上传，不重复登录', async () => {
 stored[KEY] = { token: 'old-token', userId: 1, nickName: '海豚用户', avatarUrl: '/storage/avatars/old.jpg', server: 'http://127.0.0.1:8087' }
 const p = page('mine'); p.refreshCounts()
 assert.equal(p.data.avatar, 'http://127.0.0.1:8087/storage/avatars/old.jpg')
 await p.chooseAvatar({ detail: { avatarUrl: 'wxfile://tmp_new.jpg' } })
 assert.equal(loginCount, 0)
 assert.equal(uploads.length, 1)
 assert.equal(auth.session().avatarUrl, '/storage/avatars/new.jpg')
})

test('上传失败：保留原头像和登录态，不写入假地址', async () => {
 stored[KEY] = { token: 'old-token', userId: 1, nickName: '海豚用户', avatarUrl: '/storage/avatars/old.jpg', server: 'http://127.0.0.1:8087' }
 upload = { statusCode: 422, body: { message: '头像不能超过 2MB' } }
 const p = page('mine'); p.refreshCounts()
 await p.chooseAvatar({ detail: { avatarUrl: 'wxfile://tmp_big.jpg' } })
 assert.equal(auth.session().avatarUrl, '/storage/avatars/old.jpg')
 assert.equal(p.data.avatar, 'http://127.0.0.1:8087/storage/avatars/old.jpg')
})

test('上传遇到 401：清理过期登录态', async () => {
 stored[KEY] = { token: 'expired', userId: 1, nickName: '海豚用户', avatarUrl: '/storage/avatars/old.jpg', server: 'http://127.0.0.1:8087' }
 upload = { statusCode: 401, body: { code: 401, msg: '登录已过期' } }
 const p = page('mine'); p.refreshCounts()
 await p.chooseAvatar({ detail: { avatarUrl: 'wxfile://tmp.jpg' } })
 assert.equal(auth.session(), null)
})

test('跳过头像直接登录：只登录，不发上传请求', async () => {
 const p = page('mine')
 await p.login()
 assert.equal(loginCount, 1)
 assert.equal(uploads.length, 0)
 assert.ok(auth.session().token)
})

test('头像地址拼接：相对地址补 baseUrl，绝对地址和空值原样处理', () => {
 assert.equal(auth.absoluteUrl(''), '')
 assert.equal(auth.absoluteUrl('/storage/avatars/a.jpg'), 'http://127.0.0.1:8087/storage/avatars/a.jpg')
 assert.equal(auth.absoluteUrl('storage/avatars/a.jpg'), 'http://127.0.0.1:8087/storage/avatars/a.jpg')
 assert.equal(auth.absoluteUrl('https://cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg')
})
