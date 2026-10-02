const kitchen = require('./kitchen')
const auth = require('./auth')
const KEY = 'eatwhat_catalog_v1'
function apply(data) {
 if (!data || !data.ingredients || !Array.isArray(data.ingredients.items) || !Array.isArray(data.ingredients.categories) || !Array.isArray(data.recipes) || !data.recipes.length) return false
 const ids = new Set(data.ingredients.items.map(i => i.id))
 if (ids.size !== data.ingredients.items.length || !data.ingredients.items.every(i => typeof i.id === 'string' && typeof i.name === 'string' && typeof i.category === 'string' && Array.isArray(i.aliases))) return false
 if (new Set(data.recipes.map(r => r.id)).size !== data.recipes.length || !data.recipes.every(r => typeof r.id === 'string' && typeof r.name === 'string' && r.servings > 0 && Array.isArray(r.steps) && Array.isArray(r.categories) && ['required', 'seasonings', 'optional'].every(k => Array.isArray(r[k]) && r[k].every(id => ids.has(id))) && r.materials && ['main', 'seasonings', 'optional'].every(k => Array.isArray(r.materials[k]) && r.materials[k].every(m => ids.has(m.id) && m.amount > 0 && m.unit)))) return false
 // 保留已经发布的 ID，避免旧收藏或离线库存被过滤丢失。
 const itemMap = new Map(kitchen.ingredients.items.map(i => [i.id, i]))
 data.ingredients.items.forEach(i => itemMap.set(i.id, i))
 kitchen.ingredients.items.splice(0, kitchen.ingredients.items.length, ...itemMap.values())
 kitchen.ingredients.categories = Array.from(new Set(kitchen.ingredients.categories.concat(data.ingredients.categories)))
 kitchen.ingredients.items.forEach(i => { kitchen.byId[i.id] = i })
 const recipeMap = new Map(kitchen.recipes.map(r => [r.id, r]))
 data.recipes.forEach(r => recipeMap.set(r.id, r))
 kitchen.recipes.splice(0, kitchen.recipes.length, ...recipeMap.values())
 kitchen.supported.clear()
 kitchen.recipes.filter(r => r.isActive !== false).forEach(r => r.required.concat(r.seasonings, r.optional).forEach(id => kitchen.supported.add(id)))
 return true
}
function restore() { try { apply(wx.getStorageSync(KEY)) } catch (_) {} }
async function refresh() { const data = await auth.request('/catalog', 'GET', {}, null); if (!apply(data)) throw new Error('菜谱数据格式异常'); wx.setStorageSync(KEY, data) }
module.exports = { restore, refresh, apply }
