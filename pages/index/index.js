const loginRequired = require('../../utils/login-required')
const kitchen = require('../../utils/kitchen.js')
const inventory = require('../../utils/inventory.js')
const popular = ['ji_dan', 'xi_hong_shi', 'qing_jiao', 'tu_dou', 'li_ji_rou', 'dou_fu', 'mi_fan', 'huang_gua', 'ji_chi', 'xia', 'yang_cong', 'xi_lan_hua']
const groups = { 蔬菜: ['蔬菜', '菌菇'], 肉蛋: ['肉禽', '蛋奶', '水产', '加工肉'], 主食: ['主食'], 更多: ['豆制品', '干货', '其他'] }
Page(loginRequired.page({
  data: { mode: 'fridge', shelves: [], stockCount: 0, editItem: null, category: '常用', query: '', categories: ['常用', '蔬菜', '肉蛋', '主食', '更多'], visibleItems: [], selectedItems: [], selectedCount: 0, mainCount: 0, readyCount: 0, expanded: false, filtersOpen: false, quick: false, mild: false, equipment: '全部', equipmentOptions: ['全部', '炒锅', '煮锅', '蒸锅', '免开火'] },
  onShow() { kitchen.updateShoppingBadge(); this.refresh() },
  refresh() {
    const state = kitchen.read()
    const mode = state.homeMode
    const sourceState = Object.assign({}, state, { recipeSource: mode === 'fridge' ? 'fridge' : 'selected' })
    const query = this.data.query.trim().toLowerCase()
    const selectedItems = state.selected.map(id => kitchen.byId[id]).filter(i => i.category !== '调料')
    let items = kitchen.ingredients.items.filter(item => item.category !== '调料' && (query ? [item.name].concat(item.aliases).some(n => n.toLowerCase().includes(query)) : this.data.category === '常用' ? popular.includes(item.id) : groups[this.data.category].includes(item.category)))
    if (!query && this.data.category === '常用') items.sort((a,b) => popular.indexOf(a.id)-popular.indexOf(b.id))
    const pantry = state.selected.map(id => kitchen.byId[id]).filter(i => i.category === '调料')
    this.setData({ mode, shelves: inventory.shelves(), stockCount: state.inventory.filter(row => kitchen.byId[row.id].category !== '调料').length, editItem: this.data.editItem ? state.inventory.map(inventory.display).find(row => row.key === this.data.editItem.key) || null : null, visibleItems: items.map(i => Object.assign({}, i, { selected: state.selected.includes(i.id), supported: kitchen.supported.has(i.id) })), selectedItems, selectedCount: selectedItems.length, mainCount: selectedItems.length,
      selectedText: selectedItems.map(i=>i.name).join('、'), pantryText: pantry.length ? pantry.map(i=>i.name).join('、') : '还没设置',
      readyCount: kitchen.recommend(sourceState).filter(r=>r.ready).length, quick: state.quick, mild: state.mild, equipment: state.equipment,
      filterCount: Number(!!state.quick)+Number(!!state.mild)+Number(state.equipment !== '全部') })
  },
  switchMode(e) { kitchen.save({homeMode:e.currentTarget.dataset.mode}); this.refresh() },
  addStock() { wx.navigateTo({url:'/pages/stock/stock'}) },
  importSelected() { wx.navigateTo({url:'/pages/stock/stock?source=selected'}) },
  openStock(e) { const row=inventory.rows().find(row=>row.key===e.currentTarget.dataset.key); if(row) this.setData({editItem:inventory.display(row)}) },
  closeStock() { this.setData({editItem:null}) },
  stopTap() {},
  editStock() { wx.navigateTo({url:'/pages/stock/stock?key='+this.data.editItem.key}); this.closeStock() },
  adjustStock(e) { try { if(inventory.adjust(e.stockKey, Number(e.currentTarget.dataset.delta))) this.refresh() } catch(err) { wx.showToast({title:err.message,icon:'none'}) } },
  useUp(e) { if(inventory.remove(e.stockKey)) {this.closeStock();this.refresh()} },
  onSearch(e) { this.setData({ query: e.detail.value }); this.refresh() },
  clearSearch() { this.setData({ query: '' }); this.refresh() },
  selectCategory(e) { this.setData({ category: e.currentTarget.dataset.value, query: '' }); this.refresh() },
  toggleIngredient(e) { const id=e.currentTarget.dataset.id; const selected=kitchen.read().selected; kitchen.save({selected:e.desired ? Array.from(new Set(selected.concat(id))) : selected.filter(i=>i!==id)}); this.refresh() },
  toggleSelected() { this.setData({expanded:!this.data.expanded}) },
  clearSelected() { kitchen.save({selected:kitchen.read().selected.filter(id=>kitchen.byId[id].category==='调料')}); this.refresh() },
  toggleFilters() { this.setData({filtersOpen:!this.data.filtersOpen}) },
  toggleFilter(e) { const key=e.currentTarget.dataset.key; kitchen.save({[key]:e.desired}); this.refresh() },
  selectEquipment(e) { kitchen.save({equipment:this.data.equipmentOptions[Number(e.detail.value)]}); this.refresh() },
  resetFilters() { kitchen.save({quick:false,mild:false,equipment:'全部'}); this.refresh() },
  openPantry() { wx.navigateTo({url:'/pages/pantry/pantry'}) },
  showResults() { if(this.data.mode === 'fridge' ? !this.data.stockCount : !this.data.mainCount) return; if (!kitchen.save({recipeSource:this.data.mode === 'fridge' ? 'fridge' : 'selected'})) return; wx.navigateTo({url:'/pages/results/results'}) }
}, { switchMode: true, adjustStock(e) { return Object.assign({}, e, { stockKey: this.data.editItem && this.data.editItem.key }) }, useUp(e) { return Object.assign({}, e, { stockKey: this.data.editItem && this.data.editItem.key }) },
 toggleIngredient(e) { return Object.assign({}, e, { desired: !kitchen.read().selected.includes(e.currentTarget.dataset.id) }) }, clearSelected: true,
 toggleFilter(e) { return Object.assign({}, e, { desired: !kitchen.read()[e.currentTarget.dataset.key] }) }, selectEquipment: true, resetFilters: true, showResults: true }))
