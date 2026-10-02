const loginRequired = require('../../utils/login-required')
const kitchen = require('../../utils/kitchen.js')
Page(loginRequired.page({
  data: { items: [], remaining: 0, checkedCount: 0 },
  onShow() { kitchen.updateShoppingBadge(); this.refresh() },
  refresh() {
    const state = kitchen.read()
    this.setData({ items: state.shopping.map(row => Object.assign({}, row, { name: kitchen.name(row.id), emoji: kitchen.emoji(kitchen.byId[row.id]), sourceText: (row.sources || []).join('、') })), checkedCount: state.shopping.filter(row => row.checked).length, remaining: state.shopping.filter(row => !row.checked).length })
  },
  toggleItem(e) {
    const state = kitchen.read()
    const shopping = state.shopping.map(row => row.id === e.currentTarget.dataset.id ? Object.assign({}, row, { checked: e.desired }) : row)
    kitchen.save({ shopping }); this.refresh()
  },
  removeItem(e) { kitchen.save({ shopping: kitchen.read().shopping.filter(row => row.id !== e.currentTarget.dataset.id) }); this.refresh() },
  goHome() { wx.switchTab({ url: '/pages/index/index' }) },
  putAway() {
    const state = kitchen.read()
    const purchased = state.shopping.filter(row => row.checked)
    if (!purchased.length) { wx.showToast({ title: '先勾选已经买到的材料', icon: 'none' }); return }
    wx.navigateTo({ url: '/pages/stock/stock?source=shopping' })
  }
}, { toggleItem(e) { const row = kitchen.read().shopping.find(r => r.id === e.currentTarget.dataset.id); return Object.assign({}, e, { desired: row ? !row.checked : true }) }, removeItem: true, putAway: true }))
