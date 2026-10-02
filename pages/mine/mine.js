const loginRequired = require('../../utils/login-required')
const auth = require('../../utils/auth')
const kitchen = require('../../utils/kitchen')
const cloud = require('../../utils/cloud')
Page(loginRequired.page({
 data: { favoriteCount: 0, pantryCount: 0, user: null, avatar: '', loggingIn: false, uploading: false },
 refreshCounts() {
  const state = kitchen.read()
  const user = auth.session()
  // 头像后端下发站点相对地址，这里按当前 baseUrl 拼好给 <image> 用
  this.setData({ user, avatar: auth.absoluteUrl(user && user.avatarUrl), favoriteCount: state.favorites.filter(id => kitchen.recipes.some(r => r.id === id && r.isActive !== false)).length, pantryCount: state.selected.filter(id => kitchen.byId[id].category === '调料').length })
  kitchen.updateShoppingBadge()
 },
 onShow() { this.refreshCounts(); if (auth.session() && cloud.metadata(cloud.raw()).error === 'conflict') this.resolveConflict(); if (auth.session()) auth.refresh().then(() => this.refreshCounts()).catch(() => this.refreshCounts()) },
 // 微信登录 + 账号数据同步；返回是否登录成功。不含头像，头像由 chooseAvatar 单独处理
 async signIn() {
  if (this.data.loggingIn) return false
  this.setData({ loggingIn: true })
  try {
   await auth.login(); this.refreshCounts()
   await cloud.sync(); this.refreshCounts()
   return true
  } catch (e) {
   if (auth.session() && cloud.metadata(cloud.raw()).error === 'conflict') this.resolveConflict(); else auth.showError(e)
   return false
  } finally { this.setData({ loggingIn: false }); this.refreshCounts() }
 },
 async login() {
  if (await this.signIn()) wx.showToast({ title: '登录成功' })
 },
 // 选择/更换头像：未登录时先完成登录再上传；已登录时只上传
 async chooseAvatar(e) {
  const filePath = e.detail && e.detail.avatarUrl
  if (!filePath || this.data.uploading) return
  const loggedIn = !!auth.session()
  if (!loggedIn && !(await this.signIn())) return
  this.setData({ uploading: true })
  if (wx.showLoading) wx.showLoading({ title: '正在上传头像', mask: true })
  try {
   await auth.uploadAvatar(filePath)
   this.refreshCounts()
   wx.showToast({ title: loggedIn ? '头像已更新' : '登录成功' })
  } catch (err) { auth.showError(err) }
  finally { if (wx.hideLoading) wx.hideLoading(); this.setData({ uploading: false }) }
 },
 resolveConflict() {
  wx.showActionSheet({ itemList: ['使用账号最新数据', '用本机数据更新账号'], success: result => {
   wx.showModal({ title: '确认使用这份数据？', content: '将按你的选择统一两份数据；替换前会在本机保留双方备份。', success: async r => {
    if (!r.confirm) return
    try { await cloud.resolveConflict(result.tapIndex === 0 ? 'remote' : 'local'); wx.showToast({ title: '同步完成' }) }
    catch (e) { auth.showError(e) }
    this.refreshCounts()
   } })
  } })
 },
 logout() {
  wx.showModal({ title: '退出登录', content: '退出后显示游客的本机数据，账号数据会保留。未同步修改将先保存到账号。', success: async r => {
   if (!r.confirm) return
   try { await cloud.sync(); await auth.logout(); this.refreshCounts() }
   catch (e) { this.refreshCounts(); if (auth.session() && cloud.metadata(cloud.raw()).error === 'conflict') this.resolveConflict(); else auth.showError(e) }
  } })
 },
 openAdmin() { if (this.data.user && this.data.user.isAdmin) wx.navigateTo({ url: '/pages/admin/admin' }) },
 openAbout() { wx.navigateTo({ url: '/pages/about/about' }) },
 openFridge() { if (kitchen.save({ homeMode: 'fridge' })) wx.switchTab({ url: '/pages/index/index' }) },
 openFavorites() { wx.navigateTo({ url: '/pages/results/results?favorites=1' }) },
 openPantry() { wx.navigateTo({ url: '/pages/pantry/pantry' }) }
}, { openFridge: true }))
