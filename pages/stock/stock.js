const loginRequired = require('../../utils/login-required')
const kitchen=require('../../utils/kitchen.js')
const inventory=require('../../utils/inventory.js')
const frequent=['ji_dan','qing_jiao','xi_hong_shi','dou_fu','tu_dou','huang_gua','ji_chi','li_ji_rou','xia','mi_fan','yang_cong','xi_lan_hua','hu_luo_bo','niu_nai','sheng_cai','xiang_gu']
Page(loginRequired.page({
 data:{query:'',suggestions:[],entries:[],units:inventory.units,locations:inventory.locations,editing:false,fromShopping:false,saving:false},
 onLoad(options){
  this.source=options.source;this.editKey=options.key;this.purchasedIds=[]
  const state=kitchen.read()
  let entries=[]
  if(this.editKey){ const row=state.inventory.find(row=>row.key===this.editKey);if(!row){this.setData({notFound:true});return} entries=[this.form(row)];this.setData({editing:true});wx.setNavigationBarTitle({title:'修改库存'}) }
  else if(this.source==='shopping'){this.purchasedIds=state.shopping.filter(row=>row.checked).map(row=>row.id);entries=this.purchasedIds.map(id=>this.form({id,...inventory.defaults(id),quantity:null}));this.setData({fromShopping:true})}
  else if(this.source==='selected'){entries=state.selected.filter(id=>kitchen.byId[id].category!=='调料').map(id=>this.form({id,...inventory.defaults(id),quantity:null}))}
  this.setData({entries});this.search()
 },
 form(row){return Object.assign({},row,{name:kitchen.name(row.id),quantity:row.quantity===null?'':String(row.quantity),unitIndex:inventory.units.indexOf(row.unit),locationIndex:inventory.locations.indexOf(row.location)})},
 search(){const q=this.data.query.trim();const ids=this.data.entries.map(row=>row.id);const pool=q?kitchen.ingredients.items:frequent.map(id=>kitchen.byId[id]);const suggestions=pool.filter(item=>!ids.includes(item.id)&&(!q||[item.name].concat(item.aliases).some(n=>n.includes(q)))).slice(0,40);this.setData({suggestions})},
 onSearch(e){this.setData({query:e.detail.value});this.search()},
 addIngredient(e){const id=e.currentTarget.dataset.id;if(this.data.entries.some(row=>row.id===id))return;this.setData({entries:this.data.entries.concat(this.form({id,...inventory.defaults(id),quantity:null})),query:''});this.search()},
 changeQuantity(e){this.update(Number(e.currentTarget.dataset.index),{quantity:e.detail.value})},
 setUnknown(e){this.update(Number(e.currentTarget.dataset.index),{quantity:''})},
 changeUnit(e){const index=Number(e.detail.value);this.update(Number(e.currentTarget.dataset.index),{unit:inventory.units[index],unitIndex:index})},
 changeLocation(e){const index=Number(e.detail.value);this.update(Number(e.currentTarget.dataset.index),{location:inventory.locations[index],locationIndex:index})},
 update(index,patch){this.setData({entries:this.data.entries.map((row,i)=>i===index?Object.assign({},row,patch):row)})},
 removeEntry(e){if(this.data.fromShopping||this.data.editing)return;this.setData({entries:this.data.entries.filter((_,i)=>i!==Number(e.currentTarget.dataset.index))});this.search()},
 saveEntries(){
  if(this.data.saving)return
  this.setData({saving:true})
  try{
   const entries=this.data.entries.map(({id,quantity,unit,location})=>({id,quantity,unit,location}))
   const result=inventory.commit(entries,{editKey:this.editKey,purchasedIds:this.purchasedIds})
   if(!result){this.setData({saving:false});return}
   wx.showToast({title:this.data.editing?'库存已更新':'已放入冰箱',icon:'success'})
   if(this.source==='shopping'){wx.switchTab({url:'/pages/index/index'});return}
   wx.navigateBack({fail:()=>{kitchen.save({homeMode:'fridge'});wx.switchTab({url:'/pages/index/index'})}})
  }catch(err){this.setData({saving:false});wx.showToast({title:err.message,icon:'none'})}
 }
}, { saveEntries: true }))
