const admin = require('../../utils/admin')
const auth = require('../../utils/auth')
const categoryOptions = require('../../utils/recipe-categories').categories
const empty = () => ({ name: '', description: '', emoji: '🍽️', servings: 2, timeMin: 15, difficulty: 1, equipment: '炒锅', spicy: false, categories: ['stirfry'], tags: [], steps: [''], tip: '', portionNote: '两人合吃一道菜的参考量，可搭配米饭和其他菜。', materials: { main: [], seasonings: [], optional: [] } })
Page({
 data: { allowed: false, loading: true, error: '', saving: false, form: empty(), units: admin.units, equipments: ['炒锅','煮锅','蒸锅','免开火'], equipmentIndex: 0, categories: [], materialGroups: [], pickerOpen: false, pickerQuery: '', choices: [], preview: false, previewGroups: [], categoryText: '' },
 onLoad(options) { this.options = options; this.id = options.id || ''; this.load() },
 async load() {
  this.setData({ loading: true, error: '' })
  try {
   const data = await admin.load(); this.ingredients = data.ingredients.items
   let form = empty()
   const sourceId = this.id || this.options.copy
   if (sourceId) {
    const recipe = data.recipes.find(r => r.id === sourceId)
    if (!recipe) throw new Error('菜谱不存在')
    form = JSON.parse(JSON.stringify(recipe)); this.revision = recipe.revision
    if (this.options.copy) { form.name += '（副本）'; delete form.id; delete form.revision }
   }
   if (this.options.ingredient && !sourceId) {
    const item = this.ingredients.find(i => i.id === this.options.ingredient)
    if (item) form.materials.main.push({ id: item.id, amount: '', unit: '克', note: '' })
   }
   this.setData({ form, allowed: true, equipmentIndex: Math.max(0, this.data.equipments.indexOf(form.equipment)) }); this.refreshForm()
  } catch (e) { this.setData({ error: e.message, allowed: false }) }
  finally { this.setData({ loading: false }) }
 },
 refreshForm() {
  const f = this.data.form
  this.setData({ categories: categoryOptions.map(c => Object.assign({}, c, { chosen: f.categories.includes(c.id) })), materialGroups: [{ id: 'main', label: '主料' }, { id: 'seasonings', label: '必需调料' }, { id: 'optional', label: '可不放' }].map(g => Object.assign({}, g, { rows: f.materials[g.id].map(r => Object.assign({}, r, { name: (this.ingredients.find(i => i.id === r.id) || {}).name || r.id, unitIndex: Math.max(0, admin.units.indexOf(r.unit)) })) })) })
 },
 field(e) { const form = Object.assign({}, this.data.form, { [e.currentTarget.dataset.field]: e.detail.value }); this.setData({ form, preview: false }) },
 equipment(e) { const i = Number(e.detail.value); this.setData({ equipmentIndex: i, form: Object.assign({}, this.data.form, { equipment: this.data.equipments[i] }) }) },
 spicy(e) { this.setData({ form: Object.assign({}, this.data.form, { spicy: e.detail.value }) }) },
 category(e) { const id = e.currentTarget.dataset.id; const f = this.data.form; this.setData({ form: Object.assign({}, f, { categories: f.categories.includes(id) ? f.categories.filter(c => c !== id) : f.categories.concat(id) }) }); this.refreshForm() },
 material(e) {
  const { group, index, field } = e.currentTarget.dataset
  const materials = JSON.parse(JSON.stringify(this.data.form.materials))
  materials[group][Number(index)][field] = field === 'unit' ? admin.units[Number(e.detail.value)] : e.detail.value
  this.setData({ form: Object.assign({}, this.data.form, { materials }) }); this.refreshForm()
 },
 removeMaterial(e) {
  const { group, index } = e.currentTarget.dataset
  const materials = JSON.parse(JSON.stringify(this.data.form.materials)); materials[group].splice(Number(index), 1)
  this.setData({ form: Object.assign({}, this.data.form, { materials }) }); this.refreshForm()
 },
 chooseMaterial(e) { this.group = e.currentTarget.dataset.group; this.setData({ pickerOpen: true, pickerQuery: '' }); this.filterChoices() },
 searchMaterial(e) { this.setData({ pickerQuery: e.detail.value }); this.filterChoices() },
 filterChoices() {
  const q = this.data.pickerQuery.trim(); const used = Object.values(this.data.form.materials).flat().map(i => i.id)
  this.setData({ choices: this.ingredients.filter(i => !used.includes(i.id) && (!q || [i.name].concat(i.aliases).some(n => n.includes(q)))).slice(0,60) })
 },
 addMaterial(e) { this.addMaterialById(e.currentTarget.dataset.id) },
 addMaterialById(id) {
  if (Object.values(this.data.form.materials).flat().some(r => r.id === id)) return
  const materials = JSON.parse(JSON.stringify(this.data.form.materials)); materials[this.group].push({ id, amount: '', unit: '克', note: this.group === 'optional' ? '可不放，' : '' })
  this.setData({ form: Object.assign({}, this.data.form, { materials }), pickerOpen: false }); this.refreshForm()
 },
 closePicker() { this.setData({ pickerOpen: false }) },
 stop() {},
 newIngredient() {
  wx.navigateTo({ url: '/pages/admin-ingredient/admin-ingredient', events: { savedIngredient: item => { this.ingredients.push(item); this.addMaterialById(item.id) } } })
 },
 step(e) { const steps = this.data.form.steps.slice(); steps[Number(e.currentTarget.dataset.index)] = e.detail.value; this.setData({ form: Object.assign({}, this.data.form, { steps }) }) },
 addStep() { this.setData({ form: Object.assign({}, this.data.form, { steps: this.data.form.steps.concat('') }) }) },
 removeStep(e) { const steps = this.data.form.steps.filter((_, i) => i !== Number(e.currentTarget.dataset.index)); this.setData({ form: Object.assign({}, this.data.form, { steps }) }) },
 payload() {
  const f = JSON.parse(JSON.stringify(this.data.form))
  f.name = f.name.trim(); f.steps = f.steps.map(s => s.trim()); f.servings = Number(f.servings); f.timeMin = Number(f.timeMin)
  if (!f.name) throw new Error('请填写菜名')
  if (!Number.isInteger(f.servings) || f.servings < 1 || f.servings > 8) throw new Error('人数请填 1—8 的整数')
  if (!Number.isInteger(f.timeMin) || f.timeMin < 1 || f.timeMin > 480) throw new Error('用时请填 1—480 分钟')
  if (!f.categories.length) throw new Error('至少选择一个菜品分类')
  if (!f.steps.length || f.steps.some(s => !s)) throw new Error('请补齐做法步骤')
  if (!f.materials.main.length) throw new Error('至少添加一种主料')
  for (const group of Object.keys(f.materials)) {
   f.materials[group] = f.materials[group].map(r => {
    if (!/^\d+(\.\d{1,2})?$/.test(String(r.amount)) || Number(r.amount) <= 0 || Number(r.amount) > 99999) throw new Error('材料用量需大于 0，最多两位小数')
    if (group === 'optional' && (!r.note || r.note.trim() === '可不放，')) throw new Error('请说明可选材料省略后的区别')
    return { id: r.id, amount: Number(r.amount), unit: r.unit, note: (r.note || '').trim() }
   })
  }
  if (this.id) f.revision = this.revision
  return f
 },
 previewRecipe() {
  try {
   this.draft = this.payload()
   this.setData({ preview: true, categoryText: categoryOptions.filter(c => this.draft.categories.includes(c.id)).map(c => c.label).join(' · '), previewGroups: this.data.materialGroups })
   wx.pageScrollTo({ scrollTop: 0 })
  } catch (e) { wx.showToast({ title: e.message, icon: 'none' }) }
 },
 backToEdit() { this.setData({ preview: false }) },
 async save() {
  if (this.data.saving || !this.data.allowed || !this.data.preview) return
  this.setData({ saving: true })
  try {
   await admin.save('recipes' + (this.id ? '/' + this.id : ''), this.id ? 'PUT' : 'POST', this.draft)
   wx.showToast({ title: '菜谱已保存' }); wx.navigateBack()
  } catch (e) { auth.showError(e) }
  finally { this.setData({ saving: false }) }
 }
})
