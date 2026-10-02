const loginRequired = require('../../utils/login-required')
const kitchen = require('../../utils/kitchen.js')
Page(loginRequired.page({
  data: { recipe: null, inShopping: false, groups: [], servings: 2, favorite: false, ready: false, missingText: '', steps: [], completedCount: 0, cooking: false, mild: false },
  onLoad(options) {
    this.recipe = kitchen.recipes.find(r => r.id === options.id && r.isActive !== false)
    this.done = []
    if (!this.recipe) { this.setData({ notFound: true }); return }
    wx.setNavigationBarTitle({ title: this.recipe.name })
    this.refresh()
  },
  onShow() { if (this.recipe) this.refresh() },
  onHide() { this.releaseScreen() },
  onUnload() { this.releaseScreen() },
  releaseScreen() { if (this.data.cooking) { wx.setKeepScreenOn({ keepScreenOn: false }); this.setData({ cooking: false }) } },
  refresh() {
    if (!this.recipe) return
    this.recipe = kitchen.recipes.find(r => r.id === this.recipe.id && r.isActive !== false)
    if (!this.recipe) { this.setData({ notFound: true }); return }
    const state = kitchen.cookingState()
    const match = kitchen.match(this.recipe, state.selected)
    const materials = kitchen.materials(this.recipe, state)
    this.setData({ fromInventory: state.recipeSource === 'fridge', inShopping: kitchen.shoppingStatus(this.recipe, state).inShopping, recipe: this.recipe, servings: state.servings, favorite: state.favorites.includes(this.recipe.id), ready: match.ready, missingText: match.missingText, mild: state.mild,
      groups: [{ title: '必需主料', rows: materials.main, optional: false }, { title: '必需调料', rows: materials.seasonings, optional: false }, { title: '可不放 · 不用专门买', rows: materials.optional, optional: true }].filter(group => group.rows.length),
      steps: this.recipe.steps.map((text, index) => ({ text, number: index + 1, done: this.done.includes(index) })), completedCount: this.done.length
    })
  },
  changeServings(e) { kitchen.save({ servings: Number(e.currentTarget.dataset.value) }); this.refresh() },
  toggleFavorite(e) {
    const state = kitchen.cookingState()
    const id = this.recipe.id
    kitchen.save({ favorites: e.desired ? Array.from(new Set(state.favorites.concat(id))) : state.favorites.filter(value => value !== id) })
    this.refresh()
  },
  addShopping() {
    if (!this.recipe) return
    const count = kitchen.addMissing(this.recipe, kitchen.cookingState())
    if (count < 0) return
    this.refresh()
    wx.showToast({ title: count ? '已加入 ' + count + ' 样' : '材料已在清单中', icon: 'none' })
  },
  primaryAction() {
    if (this.data.ready) this.startCooking()
    else if (this.data.inShopping) this.openShopping()
    else this.addShopping()
  },
  openShopping() { wx.switchTab({ url: '/pages/shopping/shopping' }) },
  toggleStep(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.done = this.done.includes(index) ? this.done.filter(i => i !== index) : this.done.concat(index)
    this.refresh()
    if (this.done.length === this.recipe.steps.length) { this.releaseScreen(); wx.showToast({ title: '开饭啦，好好享用！', icon: 'none' }) }
  },
  startCooking() {
    const cooking = !this.data.cooking
    if (cooking && this.done.length === this.recipe.steps.length) { this.done = []; this.refresh() }
    wx.setKeepScreenOn({ keepScreenOn: cooking, success: () => {
      this.setData({ cooking }); if (cooking) wx.pageScrollTo({ selector: '#steps', duration: 300 })
    }, fail: () => wx.showToast({ title: '常亮开启失败，仍可查看步骤', icon: 'none' }) })
  }
}, { changeServings: true, addShopping: true, toggleFavorite(e) { return Object.assign({}, e, { desired: !kitchen.read().favorites.includes(this.recipe.id) }) } }))
