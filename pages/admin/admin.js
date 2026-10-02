const admin = require('../../utils/admin')
const auth = require('../../utils/auth')
Page({
 data: { tab: 'recipes', query: '', gap: 'all', recipes: [], items: [], loading: true, allowed: false, error: '', ingredientFilter: '', filterName: '', totalRecipes: 0, totalItems: 0 },
 onShow() { this.load() },
 async load() {
  this.setData({ loading: true, error: '' })
  try { const data = await admin.load(); this.catalog = data; this.setData({ allowed: true, totalRecipes: data.recipes.length, totalItems: data.ingredients.items.length }); this.filter() }
  catch (e) { if (e.status === 403 || e.status === 401) this.setData({ allowed: false }); this.setData({ error: e.message }); }
  finally { this.setData({ loading: false }) }
 },
 filter() {
  if (!this.catalog) return
  const q = this.data.query.trim().toLowerCase()
  const items = this.catalog.ingredients.items
  const matches = items.filter(i => [i.name].concat(i.aliases).some(v => v.toLowerCase().includes(q))).map(i => i.id)
  const recipes = this.catalog.recipes.filter(r => (!this.data.ingredientFilter || r.required.includes(this.data.ingredientFilter)) && (!q || r.name.toLowerCase().includes(q) || r.required.some(id => matches.includes(id)))).map(r => Object.assign({}, r, { mainText: r.required.map(id => (items.find(i => i.id === id) || {}).name || id).join('、') }))
  this.setData({ recipes, items: admin.coverage(items, this.catalog.recipes).filter(i => (!q || matches.includes(i.id)) && (this.data.gap === 'all' || i.gap === this.data.gap)) })
 },
 changeTab(e) { this.setData({ tab: e.currentTarget.dataset.tab, query: '', ingredientFilter: '', filterName: '' }); this.filter() },
 search(e) { this.setData({ query: e.detail.value }); this.filter() },
 setGap(e) { this.setData({ gap: e.currentTarget.dataset.gap }); this.filter() },
 clearFilter() { this.setData({ ingredientFilter: '', filterName: '' }); this.filter() },
 showRelated(e) { this.setData({ tab: 'recipes', ingredientFilter: e.currentTarget.dataset.id, filterName: e.currentTarget.dataset.name, query: '' }); this.filter() },
 newRecipe() { wx.navigateTo({ url: '/pages/admin-recipe/admin-recipe' + (this.data.ingredientFilter ? '?ingredient=' + encodeURIComponent(this.data.ingredientFilter) : '') }) },
 addForIngredient(e) { wx.navigateTo({ url: '/pages/admin-recipe/admin-recipe?ingredient=' + encodeURIComponent(e.currentTarget.dataset.id) }) },
 editRecipe(e) { wx.navigateTo({ url: '/pages/admin-recipe/admin-recipe?id=' + encodeURIComponent(e.currentTarget.dataset.id) }) },
 copyRecipe(e) { wx.navigateTo({ url: '/pages/admin-recipe/admin-recipe?copy=' + encodeURIComponent(e.currentTarget.dataset.id) }) },
 newIngredient() { wx.navigateTo({ url: '/pages/admin-ingredient/admin-ingredient' }) },
 editIngredient(e) { wx.navigateTo({ url: '/pages/admin-ingredient/admin-ingredient?id=' + encodeURIComponent(e.currentTarget.dataset.id) }) },
 toggleStatus(e) {
  if (this.saving) return
  const recipe = this.catalog.recipes.find(r => r.id === e.currentTarget.dataset.id)
  wx.showModal({ title: recipe.isActive === false ? '重新上架这道菜？' : '下架这道菜？', content: recipe.isActive === false ? '上架后会重新出现在推荐中。' : '下架后不再推荐，菜谱内容会保留。', success: async r => {
   if (!r.confirm || this.saving) return
   this.saving = true
   try { await admin.save('recipes/' + recipe.id + '/status', 'PATCH', { revision: recipe.revision, isActive: recipe.isActive === false }); await this.load() }
   catch (e) { auth.showError(e) }
   finally { this.saving = false }
  } })
 }
})
