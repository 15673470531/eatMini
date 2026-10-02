const loginRequired = require('../../utils/login-required')
const kitchen=require('../../utils/kitchen.js')
Page(loginRequired.page({
 data:{items:[],count:0},
 onShow(){this.refresh()},
 refresh(){const state=kitchen.read();const items=kitchen.ingredients.items.filter(i=>i.category==='调料').map(i=>Object.assign({},i,{selected:state.selected.includes(i.id)}));this.setData({items,count:items.filter(i=>i.selected).length})},
 toggleIngredient(e){const id=e.currentTarget.dataset.id;const selected=kitchen.read().selected;kitchen.save({selected:e.desired ? Array.from(new Set(selected.concat(id))) : selected.filter(i=>i!==id)});this.refresh()},
 addBasics(){kitchen.save({selected:Array.from(new Set(kitchen.read().selected.concat(['shi_yong_you','yan','sheng_chou'])))});this.refresh()},
 done(){wx.navigateBack({fail:()=>wx.switchTab({url:'/pages/index/index'})})}
}, { toggleIngredient(e) { return Object.assign({}, e, { desired: !kitchen.read().selected.includes(e.currentTarget.dataset.id) }) }, addBasics: true }))
