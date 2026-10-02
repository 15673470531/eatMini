const auth = require('./auth')
const cloud = require('./cloud')
let pending = null
function ask() {
 return new Promise(resolve => wx.showModal({ title: '请先登录', content: '登录后会继续刚才的操作。', confirmText: '微信登录', cancelText: '暂不登录', success: r => resolve(!!r.confirm), fail: () => resolve(false) }))
}
function run(action, alive = () => true) {
 if (pending) return pending
 if (auth.session() && cloud.metadata(cloud.raw()).revision !== null) return alive() ? action() : undefined
 pending = (async () => {
  if (!auth.session()) {
   if (!(await ask()) || !alive()) return
  }
  if (wx.showLoading) wx.showLoading({ title: '正在准备', mask: true })
  try {
   if (!auth.session()) await auth.login()
   await cloud.sync()
   if (!auth.session()) throw new Error('请重新登录后再试')
   if (alive()) return action()
  } catch (e) { auth.showError(e) }
  finally { if (wx.hideLoading) wx.hideLoading() }
 })().finally(() => { pending = null })
 return pending
}
function page(definition, actions) {
 Object.keys(actions).forEach(name => {
  const original = definition[name]
  const prepare = actions[name]
  definition[name] = function(event) {
   // 留住本次操作的目标；登录后重新读取账号数据，不重放游客快照。
   const captured = typeof prepare === 'function' ? prepare.call(this, event || {}) : event
   return run(() => original.call(this, captured), () => !this.__loginActionUnloaded)
  }
 })
 const unload = definition.onUnload
 definition.onUnload = function() { this.__loginActionUnloaded = true; if (unload) return unload.call(this) }
 return definition
}
module.exports = { run, page }
