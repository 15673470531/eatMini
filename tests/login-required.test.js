// 测试固定使用本地地址，不受开发者切换真实环境影响。
require('../config/api').developmentBaseUrl = 'http://127.0.0.1:8087'
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const gate = require('../utils/login-required')
const kitchen = require('../utils/kitchen')
const cloud = require('../utils/cloud')
let stored, remote, modal, loginCount, confirm, loginFail, downloadFail, putCount, backs
function page(name) {
 let definition
 global.Page = value => { definition = value }
 const path = require.resolve('../pages/' + name + '/' + name)
 delete require.cache[path]; require(path)
 const instance = Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)) })
 instance.setData = patch => Object.assign(instance.data, patch)
 return instance
}
beforeEach(() => {
 stored = {}; remote = kitchen.defaults(); modal = null; loginCount = 0; confirm = true; loginFail = false; downloadFail = false; putCount = 0; backs = 0
 global.wx = {
  getStorageSync: k => stored[k] && JSON.parse(JSON.stringify(stored[k])), setStorageSync: (k, v) => { stored[k] = JSON.parse(JSON.stringify(v)) }, removeStorageSync: k => delete stored[k],
  showToast() {}, showLoading() {}, hideLoading() {}, setNavigationBarTitle() {}, navigateBack() { backs++ },
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
  showModal(o) { modal = o; if (o.success) o.success({ confirm }) },
  login(o) { loginCount++; if (loginFail) o.fail(); else o.success({ code: 'actual-code' }) },
  request(o) {
   if (o.url.endsWith('/user/login')) { o.success({ statusCode: 200, data: { code: 0, data: { token: 'test-token', userId: 1 } } }); return }
   if (downloadFail && o.method === 'GET') { o.fail(); return }
   if (o.method === 'PUT') { putCount++; remote = JSON.parse(JSON.stringify(o.data.state)) }
   o.success({ statusCode: 200, data: { code: 0, data: { revision: putCount, state: remote } } })
  }
 }
})
test('未登录保存被拦截，取消不登录、不写数据', async () => {
 assert.equal(kitchen.save({ servings: 4 }), null)
 confirm = false
 const p = page('pantry'); await p.addBasics()
 assert.equal(modal.title, '请先登录'); assert.equal(loginCount, 0); assert.deepEqual(stored, {})
})
test('登录后继续收藏，已有收藏不会被反向取消或覆盖其他收藏', async () => {
 remote.favorites = ['dish_qingjiao_chaodan', 'dish_jian_doufu']
 const p = page('recipe'); p.onLoad({ id: 'dish_qingjiao_chaodan' })
 await p.toggleFavorite(); await cloud.sync()
 assert.equal(loginCount, 1); assert.deepEqual(remote.favorites, ['dish_qingjiao_chaodan', 'dish_jian_doufu'])
 assert.equal(p.data.favorite, true)
})
test('入库登录后保留表单数量单位位置，只保存一次并返回', async () => {
 const p = page('stock'); p.onLoad({})
 p.setData({ entries: [{ id: 'ji_dan', quantity: '6', unit: '个', location: '冷藏' }] })
 const pending = p.saveEntries(); const repeated = p.saveEntries()
 await Promise.all([pending, repeated]); await cloud.sync()
 assert.equal(loginCount, 1); assert.equal(remote.inventory.length, 1); assert.equal(remote.inventory[0].quantity, 6); assert.equal(backs, 1)
})
test('微信失败和账号拉取失败不执行保存，表单可继续重试', async () => {
 const p = page('stock'); p.onLoad({}); p.setData({ entries: [{ id: 'ji_dan', quantity: '3', unit: '个', location: '冷藏' }] })
 loginFail = true; await p.saveEntries(); assert.equal(putCount, 0); assert.equal(p.data.entries[0].quantity, '3')
 loginFail = false; downloadFail = true; await p.saveEntries(); assert.equal(putCount, 0); assert.equal(p.data.saving, false)
 downloadFail = false; await p.saveEntries(); await cloud.sync(); assert.equal(remote.inventory[0].quantity, 3)
})
test('页面关闭后不再执行等待中的操作', async () => {
 let decide; wx.showModal = o => { decide = o.success }
 const p = page('pantry'); const pending = p.addBasics(); p.onUnload(); decide({ confirm: true }); await pending
 assert.equal(loginCount, 0); assert.equal(putCount, 0)
})
