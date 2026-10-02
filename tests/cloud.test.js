// 测试固定使用本地地址，不受开发者切换真实环境影响。
require('../config/api').developmentBaseUrl = 'http://127.0.0.1:8087'
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const auth = require('../utils/auth')
const cloud = require('../utils/cloud')
const kitchen = require('../utils/kitchen')
let stored, remote, failNext, lostResponse, puts, holdPut
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value))
function login(id) { stored.eatwhat_auth_v1 = { token: 'token' + id, userId: id, server: 'http://127.0.0.1:8087' } }
beforeEach(() => {
 stored = {}; remote = {}; failNext = false; lostResponse = false; puts = []; holdPut = null
 global.wx = {
  getStorageSync: k => clone(stored[k]), setStorageSync: (k, v) => { stored[k] = clone(v) }, removeStorageSync: k => delete stored[k], showToast() {},
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
  request(o) {
   const id = Number(o.header.Authorization.replace('Bearer token', ''))
   if (!remote[id]) remote[id] = { revision: 0, state: kitchen.defaults() }
   const r = remote[id]
   if (failNext) { failNext = false; o.fail(); return }
   if (o.method === 'GET') { o.success({ statusCode: 200, data: { code: 0, data: clone(r) } }); return }
   puts.push(clone(o.data))
   const commit = () => {
    if (o.data.requestId !== r.lastId) {
     if (o.data.revision !== r.revision) { o.success({ statusCode: 409, data: { code: 409, msg: '版本冲突' } }); return }
     r.revision++; r.state = clone(o.data.state); r.lastId = o.data.requestId
    }
    if (lostResponse) { lostResponse = false; o.fail(); return }
    o.success({ statusCode: 200, data: { code: 0, data: clone(r) } })
   }
   if (holdPut) { holdPut(commit); holdPut = null } else commit()
  }
 }
})
test('登录直接读取账号数据，游客记录不自动转入账号', async () => {
 stored['eatWhat.kitchen.v1'] = { inventory: [{ key: 'egg', id: 'ji_dan', quantity: 5, unit: '个', location: '冷藏' }], favorites: ['dish_qingjiao_chaodan'] }
 login(1); await cloud.sync(); assert.equal(kitchen.read().inventory.length, 0)
 assert.deepEqual(remote[1].state.inventory, [])
 kitchen.save({ inventory: [{ key: 'account_egg', id: 'ji_dan', quantity: 2, unit: '个', location: '冷藏' }] }); await cloud.sync()
 login(2); await cloud.sync(); assert.deepEqual(kitchen.read().favorites, [])
 delete stored.eatwhat_auth_v1; assert.equal(kitchen.read().inventory[0].quantity, 5)
 login(1); await cloud.sync(); assert.equal(kitchen.read().inventory[0].quantity, 2)
})
test('离线保留待同步数据，丢失响应重试不重复写入', async () => {
 login(1); await cloud.sync(); kitchen.save({ favorites: ['dish_qingjiao_chaodan'] }); failNext = true
 await assert.rejects(cloud.sync()); assert.equal(cloud.metadata(cloud.raw()).dirty, true)
 lostResponse = true; await assert.rejects(cloud.sync()); assert.equal(remote[1].revision, 1)
 await cloud.sync(); assert.equal(remote[1].revision, 1); assert.equal(cloud.metadata(cloud.raw()).dirty, false)
 assert.equal(puts[0].requestId, puts[1].requestId)
})
test('上传中继续编辑，确认旧请求不会清掉新修改', async () => {
 login(1); await cloud.sync(); kitchen.save({ servings: 3 })
 let release; holdPut = commit => { release = commit }
 const pending = cloud.sync(); assert.ok(release)
 kitchen.save({ servings: 4 }); release(); await pending
 assert.equal(remote[1].state.servings, 4); assert.equal(cloud.metadata(cloud.raw()).dirty, false)
 await cloud.sync()
})
test('多端冲突不覆盖，显式选择服务器数据并备份双方', async () => {
 login(1); await cloud.sync(); kitchen.save({ servings: 3 }); remote[1].revision = 1; remote[1].state.servings = 4
 await assert.rejects(cloud.sync()); assert.equal(kitchen.read().servings, 3); assert.equal(remote[1].state.servings, 4)
 await cloud.resolveConflict('remote'); assert.equal(kitchen.read().servings, 4)
 const backup = stored[cloud.key() + ':backups'][0]; assert.equal(backup.local.servings, 3); assert.equal(backup.remote.state.servings, 4)
})
