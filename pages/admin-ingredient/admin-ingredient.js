const admin = require('../../utils/admin')
const auth = require('../../utils/auth')
Page({
 data: { allowed: false, loading: true, saving: false, error: '', name: '', aliases: '', categories: admin.ingredientCategories, categoryIndex: 0 },
 onLoad(options) { this.id = options.id || ''; this.load() },
 async load() {
  this.setData({ loading: true, error: '' })
  try {
   const data = await admin.load()
   if (this.id) {
    const item = data.ingredients.items.find(i => i.id === this.id)
    if (!item) throw new Error('食材不存在')
    this.revision = item.revision; this.setData({ name: item.name, aliases: item.aliases.join('、'), categoryIndex: Math.max(0, admin.ingredientCategories.indexOf(item.category)) })
   }
   this.setData({ allowed: true })
  } catch (e) { this.setData({ error: e.message, allowed: false }) }
  finally { this.setData({ loading: false }) }
 },
 input(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
 category(e) { this.setData({ categoryIndex: Number(e.detail.value) }) },
 async save() {
  if (this.data.saving || !this.data.allowed) return
  const name = this.data.name.trim()
  if (!name) { wx.showToast({ title: '请填写食材名称', icon: 'none' }); return }
  const item = { name, category: this.data.categories[this.data.categoryIndex], aliases: Array.from(new Set(this.data.aliases.split(/[、,，\n]/).map(s => s.trim()).filter(Boolean))) }
  if (this.id) item.revision = this.revision
  this.setData({ saving: true })
  try {
   const saved = await admin.save('ingredients' + (this.id ? '/' + this.id : ''), this.id ? 'PUT' : 'POST', item)
   const channel = this.getOpenerEventChannel(); if (channel && channel.emit) channel.emit('savedIngredient', Object.assign({}, item, { id: saved.id }))
   wx.showToast({ title: '已保存' }); wx.navigateBack()
  } catch (e) { auth.showError(e) }
  finally { this.setData({ saving: false }) }
 }
})
