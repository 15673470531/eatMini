const categories = [
  { id: 'stirfry', label: '炒菜' }, { id: 'soup', label: '汤羹' },
  { id: 'braise', label: '煎焖炖' }, { id: 'steam', label: '蒸煮' },
  { id: 'cold', label: '凉菜' }, { id: 'staple', label: '主食' }
]
function includes(recipe, id) { return id === 'all' || (recipe.categories || []).includes(id) }
function group(recipes, selected = 'all') {
  const unique = recipes.filter((r, i, all) => all.findIndex(other => other.id === r.id) === i)
  const tabs = [{ id: 'all', label: '全部', count: unique.length }].concat(categories.map(c => Object.assign({}, c, { count: unique.filter(r => includes(r, c.id)).length })).filter(c => c.count > 0))
  const active = tabs.some(c => c.id === selected) ? selected : 'all'
  return { tabs, active, recipes: unique.filter(r => includes(r, active)) }
}
module.exports = { categories, includes, group }
