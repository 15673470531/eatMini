const { test } = require('node:test')
const assert = require('node:assert/strict')
const admin = require('../utils/admin')
const kitchen = require('../utils/kitchen')
const catalog = require('../utils/catalog')
const auth = require('../utils/auth')
function page(name) { let definition; global.Page = p => { definition = p }; const path = require.resolve('../pages/' + name + '/' + name); delete require.cache[path]; require(path); const result = Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)) }); result.setData = p => Object.assign(result.data, p); return result }
test('缺口只按上架菜的主料统计，可选材料不算主料', () => {
 const items = [{id:'a',category:'蔬菜'},{id:'b',category:'蔬菜'},{id:'c',category:'蔬菜'},{id:'salt',category:'调料'}]
 const stats = admin.coverage(items,[{required:['a','b']},{required:['a']},{required:['c'],isActive:false}])
 assert.equal(stats[0].gap,'covered');assert.equal(stats[1].gap,'paired');assert.equal(stats[2].gap,'none');assert.equal(stats[3].gap,'seasoning')
})
test('下架状态覆盖随包和缓存菜谱，推荐排除但记录保留', () => {
 const r = kitchen.recipes.find(r=>r.id==='dish_qingjiao_chaodan')
 const data = {ingredients:kitchen.ingredients,recipes:[Object.assign({},r,{isActive:false})]}
 assert.equal(catalog.apply(data),true)
 assert.equal(kitchen.recipes.find(x=>x.id===r.id).isActive,false)
 assert.ok(!kitchen.recommend(Object.assign(kitchen.defaults(),{selected:r.required.concat(r.seasonings)})).some(x=>x.id===r.id))
 catalog.apply({ingredients:kitchen.ingredients,recipes:[Object.assign({},r,{isActive:true})]})
})
test('菜谱复制和快速补菜，预览验证材料与步骤，新增食材保留草稿',async()=>{
 const originalLoad=admin.load
 const recipe=JSON.parse(JSON.stringify(kitchen.recipes[0]))
 admin.load=async()=>({ingredients:kitchen.ingredients,recipes:[recipe]})
 global.wx={showToast(){},pageScrollTo(){}}
 try {
  const p=page('admin-recipe');p.id='';p.options={copy:recipe.id};await p.load()
  assert.equal(p.data.form.name,recipe.name+'（副本）');assert.equal(p.data.form.id,undefined)
  p.previewRecipe();assert.equal(p.data.preview,true)
  p.data.form.materials.main[0].amount=0;assert.throws(()=>p.payload(),/用量/)
  const fresh=page('admin-recipe');fresh.id='';fresh.options={ingredient:'ji_dan'};await fresh.load()
  assert.equal(fresh.data.form.servings,2);assert.equal(fresh.data.form.materials.main[0].id,'ji_dan')
  fresh.data.form.name='保留中的草稿';fresh.group='optional';fresh.ingredients.push({id:'new',name:'新食材',aliases:[]});fresh.addMaterialById('new')
  assert.equal(fresh.data.form.name,'保留中的草稿');assert.equal(fresh.data.form.materials.optional[0].id,'new')
 } finally {admin.load=originalLoad}
})
test('保存接口成功但公共缓存刷新失败不重复提交',async()=>{
 const original=auth.request;let writes=0
 auth.request=async path=>{if(path==='/catalog')throw Error('offline');writes++;return{id:'saved'}}
 try{assert.equal((await admin.save('recipes','POST',{})).id,'saved');assert.equal(writes,1)}finally{auth.request=original}
})
