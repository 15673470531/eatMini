const kitchen = require('./kitchen.js')
const locations = ['冷藏', '冷冻', '冰箱外']
const units = ['个', '根', '盒', '克', '袋', '瓶', '把', '份', '毫升']
function defaults(id) {
  const item = kitchen.byId[id]
  const counts = { ji_dan: '个', xi_hong_shi: '个', qing_jiao: '个', tu_dou: '个', yang_cong: '个', ji_chi: '个', ji_tui: '个', huang_gua: '根', hu_luo_bo: '根', yu_mi: '根', dou_fu: '盒', ke_le: '瓶', niu_nai: '盒' }
  const outside = ['tu_dou', 'yang_cong', 'da_mi', 'mian_tiao', 'mian_fen']
  return { unit: counts[id] || (item.category === '调料' ? '瓶' : '克'), location: outside.includes(id) || ['调料', '干货'].includes(item.category) ? '冰箱外' : ['肉禽', '水产'].includes(item.category) ? '冷冻' : '冷藏' }
}
function rows() { return kitchen.read().inventory }
function quantity(value) {
  if (value === '' || value === null || value === undefined) return null
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) throw Error('数量请填正数，最多两位小数')
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0 || n > 999999) throw Error('数量应大于 0，且不超过 999999')
  return n
}
function valid(entry) {
  if (!kitchen.byId[entry.id] || !units.includes(entry.unit) || !locations.includes(entry.location)) throw Error('食材或存放位置无效')
  return Object.assign({}, entry, { quantity: quantity(entry.quantity) })
}
function commit(entries, options = {}) {
  const incoming = entries.map(valid)
  if (!incoming.length) throw Error('先选至少一种食材')
  const state = kitchen.read()
  let inventory = state.inventory.map(row => Object.assign({}, row))
  if (options.editKey) {
    const index = inventory.findIndex(row => row.key === options.editKey)
    if (index < 0 || incoming.length !== 1) throw Error('这份食材已变更，请返回重试')
    inventory[index] = Object.assign({}, incoming[0], { key: options.editKey })
  } else {
    incoming.forEach((entry, index) => {
      const existing = inventory.find(row => row.id === entry.id && row.unit === entry.unit && row.location === entry.location)
      if (existing) {
        // 数量未知时不编造总数；不同单位分别保存。
        existing.quantity = existing.quantity === null || entry.quantity === null ? null : Math.round((existing.quantity + entry.quantity) * 100) / 100
        if (existing.quantity > 999999) throw Error('累计数量过大，请分批核对')
      } else inventory.push(Object.assign({}, entry, { key: 'stock_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2, 8) }))
    })
  }
  const purchasedIds = options.purchasedIds || []
  if (purchasedIds.length && !purchasedIds.every(id => state.shopping.some(row => row.id === id && row.checked) && incoming.some(row => row.id === id))) throw Error('买菜清单已变更，请返回重新勾选')
  const shopping = state.shopping.filter(row => !purchasedIds.includes(row.id))
  // 调料继续与“常备调料”联动，主料库存不覆盖临时选食材。
  const pantryIds = incoming.filter(row => kitchen.byId[row.id].category === '调料').map(row => row.id)
  return kitchen.save({ inventory, shopping, homeMode: 'fridge', selected: Array.from(new Set(state.selected.concat(pantryIds))) })
}
function remove(key) {
  const state = kitchen.read()
  const row = state.inventory.find(item => item.key === key)
  const inventory = state.inventory.filter(item => item.key !== key)
  const selected = row && kitchen.byId[row.id].category === '调料' && !inventory.some(item => item.id === row.id) ? state.selected.filter(id => id !== row.id) : state.selected
  return kitchen.save({ inventory, selected })
}
function adjust(key, delta) {
  const state = kitchen.read()
  const row = state.inventory.find(item => item.key === key)
  if (!row || row.quantity === null) return false
  const next = Math.round((row.quantity + delta) * 100) / 100
  if (next <= 0) return remove(key)
  return commit([Object.assign({}, row, { quantity: next })], { editKey: key })
}
function display(row) { return Object.assign({}, row, { name: kitchen.name(row.id), emoji: kitchen.emoji(kitchen.byId[row.id]), amountText: row.quantity === null ? '有 · 没数过' : row.quantity + ' ' + row.unit, step: ['克', '毫升'].includes(row.unit) ? 50 : 1 }) }
function shelves() { const all = rows().map(display); return locations.map(location => ({ location, items: all.filter(row => row.location === location) })) }
module.exports = { locations, units, defaults, rows, quantity, commit, remove, adjust, display, shelves }
