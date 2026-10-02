// 本地先保存，按账号同步；revision 防止其他设备的旧快照覆盖新数据。
const auth = require('./auth')
const GUEST_KEY = 'eatWhat.kitchen.v1'
const fields = ['selected', 'quick', 'mild', 'equipment', 'servings', 'favorites', 'shopping', 'inventory', 'homeMode', 'recipeSource']
const active = {}
let timer = null
let notify = () => {}
function key(user = auth.session()) { return user ? GUEST_KEY + ':' + auth.baseUrl() + ':' + user.userId : GUEST_KEY }
function raw(storageKey = key()) { return wx.getStorageSync(storageKey) || {} }
function metadata(value) { return Object.assign({ revision: null, sequence: 0, dirty: false, pending: null, error: '' }, value.__sync) }
function payload(value) { const result = {}; fields.forEach(k => { result[k] = value[k] }); return result }
function saveLocal(state) {
 const user = auth.session()
 const value = Object.assign({}, state)
 if (user) value.__sync = Object.assign(metadata(state), { sequence: metadata(state).sequence + 1, dirty: true, error: '' })
 wx.setStorageSync(key(user), value)
 if (user) schedule()
 return value
}
function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const n = Math.floor(Math.random() * 16); return (c === 'x' ? n : (n & 3) | 8).toString(16) }) }
function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(() => sync().catch(() => {}), 500) }
function isCurrent(user) { const current = auth.session(); return current && current.token === user.token }
function persist(k, value) { wx.setStorageSync(k, value); notify() }
async function run(user) {
 const k = key(user)
 let value = raw(k)
 let meta = metadata(value)
 if (!meta.dirty || meta.revision === null) {
  const remote = await auth.request('/kitchen', 'GET', {}, user)
  if (!isCurrent(user)) return
  value = raw(k); meta = metadata(value)
  if (meta.dirty) {
   if (meta.revision !== remote.revision && !(meta.revision === null && remote.revision === 0)) {
    persist(k, Object.assign({}, value, { __sync: Object.assign(meta, { error: 'conflict' }) }))
    throw new Error('其他设备有新数据，请处理同步冲突')
   }
   meta.revision = remote.revision
   persist(k, Object.assign({}, value, { __sync: meta }))
  } else {
   persist(k, Object.assign({}, remote.state, { __sync: Object.assign(meta, { revision: remote.revision, error: '', syncedAt: Date.now() }) }))
   return
  }
 }
 // 限制连续请求；若用户一直编辑，余下修改下一轮发送。
 for (let i = 0; i < 5 && isCurrent(user); i++) {
  value = raw(k); meta = metadata(value)
  if (!meta.dirty) return
  if (meta.error === 'conflict') throw new Error('请先处理同步冲突')
  let pending = meta.pending
  if (!pending) {
   pending = { requestId: uuid(), revision: meta.revision, state: payload(value), sequence: meta.sequence }
   persist(k, Object.assign({}, value, { __sync: Object.assign(meta, { pending }) }))
  }
  let result
  try { result = await auth.request('/kitchen', 'PUT', { revision: pending.revision, requestId: pending.requestId, state: pending.state }, user) }
  catch (e) {
   value = raw(k); meta = metadata(value)
   persist(k, Object.assign({}, value, { __sync: Object.assign(meta, { error: e.status === 409 ? 'conflict' : 'offline' }) }))
   throw e
  }
  value = raw(k); meta = metadata(value)
  persist(k, Object.assign({}, value, { __sync: Object.assign(meta, { revision: result.revision, dirty: meta.sequence !== pending.sequence, pending: null, error: '', syncedAt: Date.now() }) }))
 }
 if (isCurrent(user) && metadata(raw(k)).dirty) schedule()
}
function sync() {
 if (timer) { clearTimeout(timer); timer = null }
 const user = auth.session()
 if (!user) return Promise.resolve()
 const k = key(user)
 if (active[k]) return active[k]
 active[k] = run(user).finally(() => { delete active[k] })
 return active[k]
}
function status() {
 if (!auth.session()) return '登录后可同步冰箱、收藏和清单'
 const m = metadata(raw())
 if (m.error === 'conflict') return '数据有冲突，点击处理'
 if (m.dirty) return '已保存在本机，等待同步'
 return m.revision === null ? '点击同步账号数据' : '已同步到账号'
}
async function resolveConflict(choice) {
 const user = auth.session(); if (!user) throw new Error('请先登录')
 const k = key(user); const remote = await auth.request('/kitchen', 'GET', {}, user)
 if (!isCurrent(user)) return
 const local = raw(k)
 const backups = wx.getStorageSync(k + ':backups') || []
 wx.setStorageSync(k + ':backups', backups.concat([{ at: Date.now(), local, remote }]).slice(-5))
 if (choice === 'remote') persist(k, Object.assign({}, remote.state, { __sync: { revision: remote.revision, sequence: metadata(local).sequence + 1, dirty: false, error: '', syncedAt: Date.now() } }))
 else {
  persist(k, Object.assign({}, local, { __sync: Object.assign(metadata(local), { revision: remote.revision, pending: null, dirty: true, error: '' }) }))
  await sync()
 }
}
module.exports = { key, raw, metadata, payload, saveLocal, sync, schedule, status, resolveConflict, onChange(callback) { notify = callback } }
