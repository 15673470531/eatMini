const loginRequired = require('../../utils/login-required')
const kitchen = require('../../utils/kitchen.js')
const categoryFilter = require('../../utils/recipe-categories.js')
Page(loginRequired.page({
  data: { category: 'all', categoryTabs: [], canRandom: false, recipeCount: kitchen.recipes.length, favoritesOnly: false, tab: 'ready', tabs: [], visibleRecipes: [], readyCount: 0, selectedText: '', quick: false, mild: false, showMore: false, moreCount: 0, total: 0, shoppingCount: 0 },
  onLoad(options) { this.setData({ favoritesOnly: options.favorites === '1' }); wx.setNavigationBarTitle({ title: options.favorites === '1' ? '想吃的' : '今天吃这些' }) },
  onShow() { this.refresh() },
  refresh() {
    const state = kitchen.cookingState()
    const all = this.data.favoritesOnly ? kitchen.recipes.filter(r => r.isActive !== false && state.favorites.includes(r.id)).map(r => kitchen.match(r, state.selected)) : kitchen.recommend(state)
    const ready = all.filter(r => r.ready)
    const near = all.filter(r => !r.ready && r.missing.length <= 2)
    const more = all.filter(r => r.missing.length > 2)
    this.groups = { ready, near, more, all }
    let tab = this.data.tab
    if (!this.initialized) { tab = ready.length ? 'ready' : 'near'; this.initialized = true }
    const nearPool = near.concat(this.data.showMore ? more : [])
    const pool = this.data.favoritesOnly ? all : (tab === 'near' ? nearPool : ready)
    const grouped = categoryFilter.group(pool, this.data.category)
    const visible = grouped.recipes
    this.setData({
      category: grouped.active, categoryTabs: grouped.tabs, categoryAnchor: 'category-' + grouped.active, canRandom: !this.data.favoritesOnly && tab === 'ready' && visible.length > 0,
      fromInventory: state.recipeSource === 'fridge', shoppingCount: state.shopping.filter(row => !row.checked).length, tab, total: all.length, readyCount: ready.length, moreCount: more.length,
      tabs: [{ id: 'ready', label: '现在能做', count: ready.length }, { id: 'near', label: '补一点就能做', count: nearPool.length }],
      visibleRecipes: visible.map(r => Object.assign({}, r, { favorite: state.favorites.includes(r.id) }, kitchen.shoppingStatus(r, state))),
      selectedText: state.selected.map(kitchen.name).join('、'), quick: state.quick, mild: state.mild, equipment: state.equipment
    })
  },
  addShopping(e) {
    const recipe = kitchen.recipes.find(r => r.id === e.currentTarget.dataset.id)
    if (!recipe) return
    const state = kitchen.cookingState()
    if (kitchen.shoppingStatus(recipe, state).inShopping) { this.refresh(); return }
    const count = kitchen.addMissing(recipe, state)
    if (count < 0) return
    this.refresh()
    wx.showToast({ title: count ? '已加入 ' + count + ' 样' : '材料已在清单中', icon: 'none' })
  },
  openShopping() { wx.switchTab({ url: '/pages/shopping/shopping' }) },
  toggleMore() { this.setData({ showMore: !this.data.showMore }); this.refresh() },
  changeCategory(e) { this.setData({ category: e.currentTarget.dataset.id }); this.refresh() },
  changeTab(e) { this.setData({ tab: e.currentTarget.dataset.id }); this.refresh() },
  toggleFilter(e) { const key = e.currentTarget.dataset.key; kitchen.save({ [key]: e.desired }); this.refresh() },
  resetFilters() { kitchen.save({ quick: false, mild: false, equipment: '全部' }); this.initialized = false; this.refresh() },
  openRecipe(e) { wx.navigateTo({ url: '/pages/recipe/recipe?id=' + e.currentTarget.dataset.id }) },
  backToIngredients() { wx.switchTab({ url: '/pages/index/index' }) },
  randomRecipe() {
    const ready = this.groups.ready.filter(r => categoryFilter.includes(r, this.data.category))
    if (!ready.length) { wx.showToast({ title: '先补齐材料，再帮你选一道', icon: 'none' }); return }
    const recipe = ready[Math.floor(Math.random() * ready.length)]
    wx.navigateTo({ url: '/pages/recipe/recipe?id=' + recipe.id })
  },
  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const favorites = kitchen.cookingState().favorites
    kitchen.save({ favorites: e.desired ? Array.from(new Set(favorites.concat(id))) : favorites.filter(value => value !== id) })
    this.refresh()
  }
}, { addShopping: true, toggleFilter(e) { return Object.assign({}, e, { desired: !kitchen.read()[e.currentTarget.dataset.key] }) }, resetFilters: true,
 toggleFavorite(e) { return Object.assign({}, e, { desired: !kitchen.read().favorites.includes(e.currentTarget.dataset.id) }) } }))
