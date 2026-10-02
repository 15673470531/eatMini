// 测试固定使用本地地址，不受开发者切换真实环境影响。
require('../config/api').developmentBaseUrl = 'http://127.0.0.1:8087'
// Run: node --test tests/kitchen.test.js
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
let stored = {}
global.wx = {
  getStorageSync: key => stored[key] && JSON.parse(JSON.stringify(stored[key])),
  setStorageSync: (key, value) => { stored[key] = JSON.parse(JSON.stringify(value)) },
  showToast() {}, setNavigationBarTitle() {}, navigateTo() {}, navigateBack() {},
  setKeepScreenOn({ success }) { if (success) success() }, pageScrollTo() {}
}
const kitchen = require('../utils/kitchen.js')
const inventory = require('../utils/inventory.js')
beforeEach(() => { stored = { eatwhat_auth_v1: { token: 'test-token', userId: 1, server: 'http://127.0.0.1:8087' }, 'eatWhat.kitchen.v1:http://127.0.0.1:8087:1': { __sync: { revision: 0 } } } })
const dish = id => kitchen.recipes.find(r => r.id === id)
test('空冰箱没有可做菜，不默认拥有调料', () => {
  assert.equal(kitchen.recommend(kitchen.read()).length, 0)
  const egg = dish('dish_zheng_dangeng')
  assert.deepEqual(kitchen.match(egg, ['ji_dan']).missing, ['yan'])
  assert.equal(kitchen.match(egg, ['ji_dan', 'yan']).ready, true)
})
test('紫菜和木耳不能缺失，主料完全不相关时不推荐', () => {
  assert.ok(kitchen.match(dish('dish_zicai_danhua_tang'), ['ji_dan', 'yan']).missing.includes('zi_cai'))
  assert.ok(kitchen.match(dish('dish_muer_chaodan'), ['ji_dan', 'yan', 'sheng_chou', 'shi_yong_you']).missing.includes('mu_er'))
  const result = kitchen.recommend(Object.assign(kitchen.read(), { selected: ['ji_dan', 'yan'] }))
  assert.ok(!result.some(r => r.id === 'dish_kele_jichi'))
  assert.equal(result[0].id, 'dish_zheng_dangeng')
})
test('番茄炒蛋完整闭环及筛选', () => {
  const state = Object.assign(kitchen.read(), { selected: ['xi_hong_shi', 'ji_dan', 'yan', 'shi_yong_you'], quick: true })
  let results = kitchen.recommend(state)
  assert.equal(results.find(r => r.id === 'dish_xihongshi_chaodan').ready, true)
  assert.ok(results.every(r => r.timeMin <= 15))
  state.equipment = '煮锅'
  results = kitchen.recommend(state)
  assert.ok(results.length > 0)
  assert.ok(results.every(r => r.equipment === '煮锅'))
})
test('不吃辣过滤麻婆豆腐，普通猪肉不能冒充里脊', () => {
  const state = Object.assign(kitchen.read(), { selected: ['dou_fu', 'rou_mo'], mild: true })
  assert.ok(!kitchen.recommend(state).some(r => r.id === 'dish_mapo_doufu'))
  assert.ok(kitchen.match(dish('dish_qingjiao_rousi'), ['zhu_rou', 'qing_jiao']).missing.includes('li_ji_rou'))
})
test('人数用量换算，买菜合并且只补必需材料', () => {
  const recipe = dish('dish_xihongshi_chaodan')
  kitchen.save({ selected: ['ji_dan'], servings: 4 })
  const state = kitchen.read()
  assert.equal(kitchen.materials(recipe, state).main.find(r => r.id === 'ji_dan').quantity, '6个')
  kitchen.addMissing(recipe, state)
  kitchen.addMissing(dish('dish_fanqie_jidan_tang'), kitchen.read())
  const shopping = kitchen.read().shopping
  assert.equal(shopping.filter(row => row.id === 'xi_hong_shi').length, 1)
  assert.equal(shopping.find(row => row.id === 'xi_hong_shi').sources.length, 2)
  assert.ok(!shopping.some(row => row.id === 'xiao_cong'))
})
test('全部菜谱用料引用有效，无组间重复，步骤和数量完整', () => {
  assert.ok(kitchen.recipes.length >= 44)
  assert.equal(new Set(kitchen.recipes.map(r => r.id)).size, kitchen.recipes.length)
  kitchen.recipes.forEach(r => {
    assert.ok(r.steps.length >= 4)
    const ids = r.required.concat(r.seasonings, r.optional)
    assert.equal(new Set(ids).size, ids.length, r.name)
    ids.forEach(id => assert.ok(kitchen.byId[id], id))
    assert.deepEqual(Object.values(r.materials).flat().map(row => row.id), ids)
    Object.values(r.materials).flat().forEach(row => assert.ok(row.amount > 0 && row.unit))
    assert.equal(kitchen.match(r, r.required.concat(r.seasonings)).ready, true)
  })
})
function page(path) {
  let definition
  global.Page = value => { definition = value }
  delete require.cache[require.resolve(path)]
  require(path)
  const instance = Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)), setData(patch) { Object.assign(this.data, patch) } })
  return instance
}
test('页面流程：搜索别名、选择、收藏、补料和重新匹配', () => {
  const index = page('../pages/index/index.js')
  index.onShow()
  index.onSearch({ detail: { value: '番茄' } })
  assert.equal(index.data.visibleItems[0].id, 'xi_hong_shi')
  index.toggleIngredient({ currentTarget: { dataset: { id: 'ji_dan' } } })
  const pantry = page('../pages/pantry/pantry.js')
  pantry.addBasics()
  const recipe = page('../pages/recipe/recipe.js')
  recipe.onLoad({ id: 'dish_xihongshi_chaodan' })
  assert.equal(recipe.data.ready, false)
  recipe.toggleFavorite()
  assert.equal(recipe.data.favorite, true)
  recipe.addShopping()
  const shopping = page('../pages/shopping/shopping.js')
  shopping.onShow()
  assert.equal(shopping.data.remaining, 1)
  shopping.toggleItem({ currentTarget: { dataset: { id: 'xi_hong_shi' } } })
  shopping.putAway()
  assert.ok(kitchen.read().shopping.length > 0, '打开入库页不能提前清空清单')
  const stock = page('../pages/stock/stock.js')
  stock.onLoad({ source: 'shopping' })
  stock.saveEntries()
  shopping.onShow()
  inventory.commit([{ id: 'ji_dan', quantity: 3, unit: '个', location: '冷藏' }])
  kitchen.save({ recipeSource: 'fridge' })
  assert.equal(shopping.data.items.length, 0)
  recipe.onShow()
  assert.equal(recipe.data.ready, true)
  recipe.startCooking()
  assert.equal(recipe.data.cooking, true)
  recipe.onHide()
  assert.equal(recipe.data.cooking, false)
  const results = page('../pages/results/results.js')
  results.onLoad({ favorites: '1' }); results.onShow()
  assert.equal(results.data.visibleRecipes[0].id, recipe.recipe.id)
})
test('无效菜谱 ID 与损坏本地数据有兜底', () => {
  stored['eatWhat.kitchen.v1:http://127.0.0.1:8087:1'] = { selected: ['invalid'], favorites: null, shopping: {}, servings: 99 }
  assert.deepEqual(kitchen.read().selected, [])
  assert.deepEqual(kitchen.read().shopping, [])
  assert.equal(kitchen.read().servings, 2)
  const recipe = page('../pages/recipe/recipe.js')
  recipe.onLoad({ id: 'invalid' })
  assert.equal(recipe.data.notFound, true)
})

test('用户回归：鸡蛋加青椒必须能推荐青椒炒鸡蛋', () => {
  const state = Object.assign(kitchen.read(), { selected: ['ji_dan', 'qing_jiao'] })
  const recipe = kitchen.recommend(state).find(r => r.id === 'dish_qingjiao_chaodan')
  assert.ok(recipe)
  assert.deepEqual(recipe.missing, ['shi_yong_you', 'yan'])
  state.selected.push('shi_yong_you', 'yan')
  state.quick = true
  state.mild = true
  assert.equal(kitchen.recommend(state).find(r => r.id === recipe.id).ready, true)
})

test('家常省事：青椒肉丝不要求淀粉、生抽和蒜', () => {
  const state = Object.assign(kitchen.read(), { selected: ['qing_jiao', 'li_ji_rou', 'shi_yong_you', 'yan'], quick: true })
  const recipe = dish('dish_qingjiao_rousi')
  assert.equal(kitchen.recommend(state).find(r => r.id === recipe.id).ready, true)
  assert.equal(kitchen.addMissing(recipe, state), 0)
  assert.deepEqual(kitchen.read().shopping, [])
  const rows = kitchen.materials(recipe, state).optional
  for (const id of ['dian_fen', 'sheng_chou', 'suan']) {
    assert.ok(rows.find(row => row.id === id && row.note.includes('可不放')))
  }
  assert.ok(recipe.steps.some(step => step.includes('不用腌')))
})
test('同类菜都放宽配料：无生抽炒饭、无蒜西兰花、无油番茄汤、素版辣豆腐', () => {
  const cases = [
    ['dish_dan_chaofan', ['mi_fan', 'ji_dan', 'shi_yong_you', 'yan']],
    ['dish_muer_chaodan', ['mu_er', 'ji_dan', 'shi_yong_you', 'yan']],
    ['dish_yangcong_chaodan', ['yang_cong', 'ji_dan', 'shi_yong_you', 'yan']],
    ['dish_qingchao_xilanhua', ['xi_lan_hua', 'shi_yong_you', 'yan']],
    ['dish_fanqie_jidan_tang', ['xi_hong_shi', 'ji_dan', 'yan']],
    ['dish_mapo_doufu', ['dou_fu', 'dou_ban_jiang', 'shi_yong_you']],
    ['dish_liangban_huanggua', ['huang_gua', 'yan', 'cu']],
    ['dish_kele_jichi', ['ji_chi', 'ke_le', 'sheng_chou']]
  ]
  cases.forEach(([id, selected]) => assert.equal(kitchen.match(dish(id), selected).ready, true, id))
})
test('可省材料都有说明，关键风味和主料仍参与缺料判断', () => {
  kitchen.recipes.forEach(recipe => {
    recipe.materials.optional.forEach(row => assert.ok(row.note && row.note.includes('可不放'), recipe.id + '/' + row.id))
  })
  assert.ok(kitchen.match(dish('dish_culiu_tudousi'), ['tu_dou', 'shi_yong_you', 'yan']).missing.includes('cu'))
  assert.ok(kitchen.match(dish('dish_suanxiang_xiaren'), ['xia', 'shi_yong_you', 'yan']).missing.includes('suan'))
  assert.ok(kitchen.match(dish('dish_kele_jichi'), ['ji_chi', 'sheng_chou']).missing.includes('ke_le'))
})

test('底部 Tab 与页面跳转使用正确路由，常备调料独立管理', () => {
  const config = require('../app.json')
  assert.deepEqual(config.tabBar.list.map(t => t.text), ['做什么', '买什么', '我的'])
  config.tabBar.list.forEach(t => assert.ok(config.pages.includes(t.pagePath)))
  let target
  wx.switchTab = options => { target = options.url }
  const recipe = page('../pages/recipe/recipe.js')
  recipe.openShopping()
  assert.equal(target, '/pages/shopping/shopping')
  const shopping = page('../pages/shopping/shopping.js')
  shopping.goHome()
  assert.equal(target, '/pages/index/index')
  const home = page('../pages/index/index.js')
  kitchen.save({ selected: ['ji_dan', 'yan'] })
  home.onShow()
  assert.equal(home.data.selectedCount, 1)
  home.clearSelected()
  assert.deepEqual(kitchen.read().selected, ['yan'])
  const mine = page('../pages/mine/mine.js')
  mine.onShow()
  assert.equal(mine.data.pantryCount, 1)
})


test('首页常用食材：一种主料加油盐至少有一道菜', () => {
  const popular = ['ji_dan', 'xi_hong_shi', 'qing_jiao', 'tu_dou', 'li_ji_rou', 'dou_fu', 'mi_fan', 'huang_gua', 'ji_chi', 'xia', 'yang_cong', 'xi_lan_hua']
  popular.forEach(id => {
    const state = Object.assign(kitchen.read(), { selected: [id, 'shi_yong_you', 'yan'] })
    assert.ok(kitchen.recommend(state).some(r => r.ready && r.required.length === 1 && r.required[0] === id), id)
  })
})
test('仅选豆腐可见简单做法，快手炒锅筛选不再空白', () => {
  const state = Object.assign(kitchen.read(), { selected: ['dou_fu'], quick: true, mild: true, equipment: '炒锅' })
  const results = kitchen.recommend(state)
  for (const id of ['dish_jian_doufu', 'dish_chaosui_doufu']) {
    const recipe = results.find(r => r.id === id)
    assert.ok(recipe, id)
    assert.deepEqual(recipe.missingMain, [])
    assert.deepEqual(recipe.missing, ['shi_yong_you', 'yan'])
  }
  state.selected.push('shi_yong_you', 'yan')
  assert.ok(kitchen.recommend(state).filter(r => r.ready).length >= 2)
  kitchen.save(state)
  const resultsPage = page('../pages/results/results.js')
  resultsPage.onLoad({}); resultsPage.onShow()
  assert.equal(resultsPage.data.tab, 'ready')
  assert.ok(resultsPage.data.visibleRecipes.some(r => r.id === 'dish_chaosui_doufu'))
})
test('豆腐主料不缺但没勾油盐：归入补一点，采购仅补必需调料', () => {
  kitchen.save({ selected: ['dou_fu'], quick: true, equipment: '炒锅' })
  const resultsPage = page('../pages/results/results.js')
  resultsPage.onLoad({}); resultsPage.onShow()
  assert.equal(resultsPage.data.tab, 'near')
  assert.ok(resultsPage.data.visibleRecipes.some(r => r.id === 'dish_jian_doufu'))
  kitchen.addMissing(dish('dish_jian_doufu'), kitchen.read())
  assert.deepEqual(kitchen.read().shopping.map(r => r.id), ['shi_yong_you', 'yan'])
  assert.equal(kitchen.match(dish('dish_qingdun_doufu'), ['dou_fu', 'yan']).ready, true)
})

test('推荐卡片直接加入，不跳转，重复点击不重复加', () => {
  kitchen.save({ selected: ['ji_dan', 'shi_yong_you', 'yan'], quick: true, equipment: '炒锅' })
  let navigated = false
  const originalNavigate = wx.navigateTo
  wx.navigateTo = () => { navigated = true }
  try {
    const results = page('../pages/results/results.js')
    results.onLoad({}); results.onShow()
    results.changeTab({ currentTarget: { dataset: { id: 'near' } } })
    const event = { currentTarget: { dataset: { id: 'dish_qingjiao_chaodan' } } }
    results.addShopping(event)
    assert.equal(navigated, false)
    assert.equal(results.data.tab, 'near')
    assert.equal(results.data.visibleRecipes.find(r => r.id === event.currentTarget.dataset.id).inShopping, true)
    assert.deepEqual(kitchen.read().shopping.map(r => r.id), ['qing_jiao'])
    results.addShopping(event)
    assert.equal(kitchen.read().shopping.length, 1)
    assert.equal(results.data.shoppingCount, 1)
  } finally { wx.navigateTo = originalNavigate }
})
test('共用缺料合并、已勾选状态保留、清单角标同步', () => {
  let badge = ''
  wx.setTabBarBadge = options => { assert.equal(options.index, 1); badge = options.text }
  wx.removeTabBarBadge = () => { badge = '' }
  kitchen.save({ selected: ['ji_dan', 'yan', 'shi_yong_you'] })
  assert.equal(kitchen.addMissing(dish('dish_xihongshi_chaodan'), kitchen.read()), 1)
  assert.equal(badge, '1')
  const shopping = page('../pages/shopping/shopping.js')
  shopping.toggleItem({ currentTarget: { dataset: { id: 'xi_hong_shi' } } })
  assert.equal(badge, '')
  assert.equal(kitchen.addMissing(dish('dish_fanqie_jidan_tang'), kitchen.read()), 0)
  assert.equal(kitchen.read().shopping[0].checked, true)
  assert.equal(badge, '')
  shopping.putAway()
  assert.ok(kitchen.read().shopping.length > 0, '打开入库页不能提前清空清单')
  const stock = page('../pages/stock/stock.js')
  stock.onLoad({ source: 'shopping' })
  stock.saveEntries()
  shopping.onShow()
  inventory.commit([{ id: 'ji_dan', quantity: 3, unit: '个', location: '冷藏' }])
  kitchen.save({ recipeSource: 'fridge' })
  assert.equal(kitchen.read().shopping.length, 0)
  assert.ok(kitchen.read().inventory.some(row => row.id === 'xi_hong_shi'))
  assert.equal(kitchen.match(dish('dish_xihongshi_chaodan'), kitchen.cookingState().selected).ready, true)
})
test('详情主按钮：补料、查看清单、材料齐全后做饭', () => {
  kitchen.save({ selected: ['ji_dan', 'shi_yong_you', 'yan'] })
  const recipe = page('../pages/recipe/recipe.js')
  recipe.onLoad({ id: 'dish_qingjiao_chaodan' })
  recipe.primaryAction()
  assert.equal(recipe.data.inShopping, true)
  assert.equal(recipe.data.ready, false)
  assert.equal(recipe.data.cooking, false)
  let destination
  wx.switchTab = options => { destination = options.url }
  recipe.primaryAction()
  assert.equal(destination, '/pages/shopping/shopping')
  kitchen.save({ selected: kitchen.read().selected.concat('qing_jiao'), shopping: [] })
  recipe.onShow()
  assert.equal(recipe.data.ready, true)
  recipe.primaryAction()
  assert.equal(recipe.data.cooking, true)
  recipe.onHide()
})
test('保存失败不显示已加入，删除清单后恢复加入按钮', () => {
  kitchen.save({ selected: ['ji_dan', 'shi_yong_you', 'yan'] })
  const results = page('../pages/results/results.js')
  results.onLoad({}); results.onShow()
  results.changeTab({ currentTarget: { dataset: { id: 'near' } } })
  const event = { currentTarget: { dataset: { id: 'dish_qingjiao_chaodan' } } }
  const originalSave = wx.setStorageSync
  try {
    wx.setStorageSync = () => { throw new Error('storage full') }
    results.addShopping(event)
    assert.equal(kitchen.read().shopping.length, 0)
    assert.equal(results.data.visibleRecipes.find(r => r.id === event.currentTarget.dataset.id).inShopping, false)
  } finally { wx.setStorageSync = originalSave }
  results.addShopping(event)
  kitchen.save({ shopping: [] })
  results.onShow()
  assert.equal(results.data.visibleRecipes.find(r => r.id === event.currentTarget.dataset.id).inShopping, false)
})

test('库存数量累加、未知数量与不同单位不乱换算', () => {
  inventory.commit([{id:'ji_dan',quantity:6,unit:'个',location:'冷藏'}])
  inventory.commit([{id:'ji_dan',quantity:2,unit:'个',location:'冷藏'}])
  assert.equal(inventory.rows()[0].quantity,8)
  inventory.commit([{id:'ji_dan',quantity:1,unit:'盒',location:'冷藏'}])
  assert.equal(inventory.rows().length,2)
  inventory.commit([{id:'ji_dan',quantity:'',unit:'个',location:'冷藏'}])
  assert.equal(inventory.rows().find(row=>row.unit==='个').quantity,null)
  assert.equal(inventory.rows().find(row=>row.unit==='盒').quantity,1)
})
test('库存修改、移动与用完，临时选择互不污染', () => {
  kitchen.save({selected:['ji_dan','yan']})
  inventory.commit([{id:'dou_fu',quantity:2,unit:'盒',location:'冷藏'}])
  const key=inventory.rows()[0].key
  inventory.commit([{id:'dou_fu',quantity:1,unit:'盒',location:'冷冻'}],{editKey:key})
  assert.equal(inventory.rows()[0].location,'冷冻')
  assert.deepEqual(kitchen.read().selected,['ji_dan','yan'])
  kitchen.save({recipeSource:'fridge'})
  assert.deepEqual(kitchen.cookingState().selected,['dou_fu','yan'])
  assert.ok(kitchen.recommend(kitchen.read()).some(r=>r.id==='dish_qingdun_doufu'&&r.ready))
  inventory.adjust(key,-1)
  assert.equal(inventory.rows().length,0)
  assert.equal(kitchen.recommend(kitchen.read()).length,0)
  kitchen.save({recipeSource:'selected'})
  assert.ok(kitchen.recommend(kitchen.read()).some(r=>r.id==='dish_zheng_dangeng'&&r.ready))
})
test('入库验证是整批提交，输入错误或存储失败不丢买菜清单', () => {
  kitchen.save({shopping:[{id:'ji_dan',checked:true,sources:[]}]})
  const before=kitchen.read()
  assert.throws(()=>inventory.commit([{id:'ji_dan',quantity:-1,unit:'个',location:'冷藏'}],{purchasedIds:['ji_dan']}))
  assert.deepEqual(kitchen.read(),before)
  const original=wx.setStorageSync
  try{
    wx.setStorageSync=()=>{throw Error('full')}
    assert.equal(inventory.commit([{id:'ji_dan',quantity:6,unit:'个',location:'冷藏'}],{purchasedIds:['ji_dan']}),null)
    assert.deepEqual(kitchen.read(),before)
  }finally{wx.setStorageSync=original}
  assert.ok(inventory.commit([{id:'ji_dan',quantity:6,unit:'个',location:'冷藏'}],{purchasedIds:['ji_dan']}))
  assert.equal(kitchen.read().shopping.length,0)
  assert.equal(inventory.rows()[0].quantity,6)
  assert.throws(()=>inventory.commit([{id:'ji_dan',quantity:6,unit:'个',location:'冷藏'}],{purchasedIds:['ji_dan']}))
  assert.equal(inventory.rows()[0].quantity,6)
})
test('旧数据不自动冒充库存，页面可批量确认导入并持久显示', () => {
  kitchen.save({selected:['ji_dan','qing_jiao','yan']})
  const home=page('../pages/index/index.js');home.onShow()
  assert.equal(home.data.mode,'fridge')
  assert.equal(home.data.stockCount,0)
  const stock=page('../pages/stock/stock.js');stock.onLoad({source:'selected'})
  assert.equal(stock.data.entries.length,2)
  stock.changeQuantity({currentTarget:{dataset:{index:0}},detail:{value:'6'}})
  stock.saveEntries()
  home.onShow()
  assert.equal(home.data.stockCount,2)
  const chilled=home.data.shelves.find(s=>s.location==='冷藏').items
  assert.equal(chilled.find(r=>r.id==='ji_dan').amountText,'6 个')
  assert.equal(chilled.find(r=>r.id==='qing_jiao').amountText,'有 · 没数过')
  home.showResults()
  assert.equal(kitchen.read().recipeSource,'fridge')
  home.switchMode({currentTarget:{dataset:{mode:'selected'}}})
  home.clearSelected()
  assert.equal(inventory.rows().length,2)
})
test('调料入库与用完同步常备调料，未知数量可修改成确切数量', () => {
  inventory.commit([{id:'sheng_chou',quantity:null,unit:'瓶',location:'冰箱外'}])
  assert.ok(kitchen.read().selected.includes('sheng_chou'))
  const key=inventory.rows()[0].key
  assert.equal(inventory.adjust(key,1),false)
  inventory.commit([{id:'sheng_chou',quantity:1,unit:'瓶',location:'冰箱外'}],{editKey:key})
  inventory.remove(key)
  assert.ok(!kitchen.read().selected.includes('sheng_chou'))
})

test('分类计数按菜品去重，多分类不重复卡片，隐藏空分类', () => {
  const categories = require('../utils/recipe-categories.js')
  const steamed = dish('dish_zheng_dangeng')
  const soup = dish('dish_fanqie_jidan_tang')
  const result = categories.group([steamed, soup, steamed], 'soup')
  assert.equal(result.tabs[0].count, 2)
  assert.equal(result.tabs.find(t => t.id === 'soup').count, 2)
  assert.equal(result.tabs.find(t => t.id === 'steam').count, 1)
  assert.ok(!result.tabs.some(t => t.id === 'cold'))
  assert.equal(result.recipes.length, 2)
  assert.equal(categories.group([soup], 'steam').active, 'all')
  kitchen.recipes.forEach(r => assert.ok(r.categories.length && r.categories.every(id => categories.categories.some(c => c.id === id)), r.name))
})
test('推荐分组切换保留可用分类，筛选后无结果自动回全部', () => {
  kitchen.save({ selected: ['ji_dan','xi_hong_shi','shi_yong_you','yan'], recipeSource: 'selected' })
  const results = page('../pages/results/results.js')
  results.onLoad({}); results.onShow()
  results.changeCategory({currentTarget:{dataset:{id:'soup'}}})
  assert.equal(results.data.category, 'soup')
  assert.ok(results.data.visibleRecipes.every(r => r.categories.includes('soup')))
  assert.equal(results.data.categoryTabs.find(c => c.id === 'soup').count, results.data.visibleRecipes.length)
  results.changeTab({currentTarget:{dataset:{id:'near'}}})
  assert.equal(results.data.category,'soup')
  assert.ok(results.data.visibleRecipes.some(r=>r.id==='dish_zicai_danhua_tang'))
  kitchen.save({equipment:'炒锅'})
  results.onShow()
  assert.equal(results.data.category,'all')
  assert.ok(!results.data.categoryTabs.some(c=>c.id==='soup'))
  assert.equal(results.data.categoryTabs[0].count, results.data.visibleRecipes.length)
})
test('展开更多后数量与列表一致，收藏也可按分类筛选', () => {
  kitchen.save({selected:['ji_dan'],recipeSource:'selected'})
  const results=page('../pages/results/results.js');results.onLoad({});results.onShow()
  results.toggleMore()
  assert.equal(results.data.tabs.find(t=>t.id==='near').count,results.data.categoryTabs[0].count)
  assert.equal(results.data.visibleRecipes.length,results.data.categoryTabs[0].count)
  kitchen.save({favorites:['dish_zheng_dangeng','dish_dan_chaofan']})
  const favorites=page('../pages/results/results.js');favorites.onLoad({favorites:'1'});favorites.onShow()
  favorites.changeCategory({currentTarget:{dataset:{id:'staple'}}})
  assert.deepEqual(favorites.data.visibleRecipes.map(r=>r.id),['dish_dan_chaofan'])
  assert.equal(favorites.data.canRandom,false)
})
test('份量说明与人数换算：青椒按净重、鸡蛋整颗、干湿原料区分', () => {
  const recipe = dish('dish_qingjiao_chaodan')
  for (const servings of [1, 2, 3, 4]) {
    const rows = kitchen.materials(recipe, { ...kitchen.read(), servings }).main
    assert.equal(rows.find(r => r.id === 'qing_jiao').quantity, (125 * servings) + '克')
    assert.equal(rows.find(r => r.id === 'ji_dan').quantity, Math.round(1.5 * servings) + '个')
  }
  assert.match(dish('dish_muer_chaodan').materials.main[0].note, /干木耳/)
  assert.match(dish('dish_dan_chaofan').materials.main[0].note, /煮熟/)
  assert.match(dish('dish_suanxiang_xiaren').materials.main[0].note, /去头去壳/)
  assert.match(dish('dish_baizhu_xia').materials.main[0].note, /带头带壳/)
  kitchen.recipes.forEach(r => assert.ok(r.portionNote))
})
