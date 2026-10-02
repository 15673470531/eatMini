const auth = require('./auth')
const catalog = require('./catalog')
const ingredientCategories = ['蔬菜','菌菇','豆制品','肉禽','蛋奶','水产','主食','干货','加工肉','其他','调料']
const units = ['个','根','盒','克','袋','瓶','把','份','毫升','瓣','粒','汤匙','茶匙','块','片','碗']
async function load() { return auth.request('/admin/catalog') }
async function save(path, method, data) {
 const result = await auth.request('/admin/' + path, method, data)
 // 写入成功即为成功；公共缓存刷新失败不让用户重复提交。
 await catalog.refresh().catch(() => {})
 return result
}
function coverage(items, recipes) {
 const active = recipes.filter(r => r.isActive !== false)
 return items.map(item => {
  const related = active.filter(r => r.required.includes(item.id))
  const solo = related.filter(r => r.required.length === 1).length
  return Object.assign({}, item, { recipeCount: related.length, soloCount: solo, gap: item.category === '调料' ? 'seasoning' : related.length === 0 ? 'none' : solo === 0 ? 'paired' : 'covered', coverageText: item.category === '调料' ? '调味食材' : related.length === 0 ? '暂无菜谱' : solo === 0 ? '只有搭配菜' : '有单主料做法' })
 })
}
module.exports = { load, save, coverage, ingredientCategories, units }
