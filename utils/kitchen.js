const auth = require('./auth')
const cloud = require('./cloud')
const ingredients = require('../data/ingredients.js')
const recipes = require('../data/recipes.js')
const byId = {}
ingredients.items.forEach(item => { byId[item.id] = item })
const STORAGE_KEY = 'eatWhat.kitchen.v1'
const defaults = () => ({ selected: [], quick: false, mild: false, equipment: '全部', servings: 2, favorites: [], shopping: [], inventory: [], homeMode: 'fridge', recipeSource: 'selected' })
function read() {
  try {
    const saved = cloud.raw()
    const state = Object.assign(defaults(), saved && typeof saved === 'object' ? saved : {})
    state.selected = Array.isArray(state.selected) ? state.selected.filter(id => byId[id]) : []
    state.favorites = Array.isArray(state.favorites) ? state.favorites.filter(id => recipes.some(r => r.id === id)) : []
    state.shopping = Array.isArray(state.shopping) ? state.shopping.filter(row => row && byId[row.id]) : []
    state.inventory = Array.isArray(state.inventory) ? state.inventory.filter(row => row && typeof row.key === 'string' && byId[row.id] && ['冷藏', '冷冻', '冰箱外'].includes(row.location) && ['个', '根', '盒', '克', '袋', '瓶', '把', '份', '毫升'].includes(row.unit) && (row.quantity === null || (typeof row.quantity === 'number' && Number.isFinite(row.quantity) && row.quantity > 0 && row.quantity <= 999999))) : []
    state.homeMode = state.homeMode === 'selected' ? 'selected' : 'fridge'
    state.recipeSource = state.recipeSource === 'fridge' ? 'fridge' : 'selected'
    state.servings = [1, 2, 3, 4].includes(state.servings) ? state.servings : 2
    state.equipment = ['全部', '炒锅', '煮锅', '蒸锅', '免开火'].includes(state.equipment) ? state.equipment : '全部'
    return state
  } catch (e) { return defaults() }
}
function save(patch) {
  if (!auth.session()) { wx.showToast({ title: '请先登录后再保存', icon: 'none' }); return null }
  const next = Object.assign(read(), patch)
  try { cloud.saveLocal(next) } catch (e) {
    wx.showToast({ title: '保存失败，请检查设备存储空间', icon: 'none' })
    return null
  }
  updateShoppingBadge(next)
  return next
}
function available(id, selected) {
  // 不将普通猪肉自动视为里脊，也不将干货或调料默认为已有。
  return selected.includes(id)
}
function name(id) { return byId[id] ? byId[id].name : id }
function match(recipe, selected) {
  const missingMain = recipe.required.filter(id => !available(id, selected))
  const missingSeasonings = recipe.seasonings.filter(id => !available(id, selected))
  const missing = missingMain.concat(missingSeasonings)
  return Object.assign({}, recipe, {
    missingMain, missingSeasonings, missing,
    matchedMain: recipe.required.length - missingMain.length,
    ready: missing.length === 0,
    missingText: missing.map(name).join('、'),
    reason: missing.length === 0 ? '主料和必需调料都齐了' : '还缺：' + missing.map(name).join('、'),
    mainText: recipe.required.map(name).join(' · ')
  })
}
function cookingState(state = read()) {
  if (state.recipeSource !== 'fridge') return state
  const pantry = state.selected.filter(id => byId[id].category === '调料')
  return Object.assign({}, state, { selected: Array.from(new Set(state.inventory.map(row => row.id).concat(pantry))) })
}
function recommend(state) {
  state = cookingState(state)
  return recipes.filter(r => r.isActive !== false).map(r => match(r, state.selected))
    .filter(r => r.matchedMain > 0)
    .filter(r => !state.quick || r.timeMin <= 15)
    .filter(r => !state.mild || !r.spicy)
    .filter(r => state.equipment === '全部' || r.equipment === state.equipment)
    .sort((a, b) => a.missing.length - b.missing.length || b.matchedMain - a.matchedMain || a.timeMin - b.timeMin)
}
function materials(recipe, state) {
  const result = {}
  Object.keys(recipe.materials).forEach(group => {
    result[group] = recipe.materials[group].map(row => ({
      id: row.id, name: name(row.id),
      quantity: String(row.id === 'ji_dan' ? Math.round(row.amount * state.servings / recipe.servings) : Math.round(row.amount * state.servings / recipe.servings * 10) / 10) + row.unit,
      owned: available(row.id, state.selected), note: row.note || ''
    }))
  })
  return result
}
function shoppingStatus(recipe, state) {
  const missing = match(recipe, state.selected).missing
  return { inShopping: missing.length > 0 && missing.every(id => state.shopping.some(row => row.id === id)) }
}
function updateShoppingBadge(state = read()) {
  const count = state.shopping.filter(row => !row.checked).length
  // 二级页没有原生 Tab；回到任一 Tab 时会再次刷新角标。
  if (count && typeof wx.setTabBarBadge === 'function') {
    wx.setTabBarBadge({ index: 1, text: count > 99 ? '99+' : String(count), fail() {} })
  } else if (!count && typeof wx.removeTabBarBadge === 'function') {
    wx.removeTabBarBadge({ index: 1, fail() {} })
  }
  return count
}
function addMissing(recipe, state) {
  const missing = match(recipe, state.selected).missing
  if (!missing.length) return 0
  const shopping = state.shopping.map(row => Object.assign({}, row, { sources: (row.sources || []).slice() }))
  let added = 0
  missing.forEach(id => {
    const existing = shopping.find(row => row.id === id)
    // 重复加入不取消用户已买好的勾选。
    if (existing) existing.sources = Array.from(new Set(existing.sources.concat(recipe.name)))
    else { shopping.push({ id, checked: false, sources: [recipe.name] }); added += 1 }
  })
  return save({ shopping }) ? added : -1
}
const emojiMap = { xi_hong_shi: '🍅', ji_dan: '🥚', tu_dou: '🥔', huang_gua: '🥒', qing_jiao: '🫑', xi_lan_hua: '🥦', yang_cong: '🧅', hu_luo_bo: '🥕', yu_mi: '🌽', qie_zi: '🍆', mi_fan: '🍚', mian_tiao: '🍜', dou_fu: '◻️', sheng_cai: '🥬', ji_chi: '🍗', xia: '🦐', xiang_gu: '🍄', suan: '🧄', ke_le: '🥤' }
function emoji(item) { return emojiMap[item.id] || ({ '蔬菜': '🥬', '菌菇': '🍄', '肉禽': '🥩', '蛋奶': '🥚', '水产': '🐟', '调料': '🧂', '主食': '🍚', '干货': '🥣' })[item.category] || '🍽️' }
const supported = new Set()
recipes.filter(r => r.isActive !== false).forEach(r => r.required.concat(r.seasonings, r.optional).forEach(id => supported.add(id)))
module.exports = { defaults, ingredients, recipes, byId, supported, read, save, cookingState, available, name, match, recommend, materials, addMissing, shoppingStatus, updateShoppingBadge, emoji }
