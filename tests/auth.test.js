// 测试固定使用本地地址，不受开发者切换真实环境影响。
require('../config/api').developmentBaseUrl = 'http://127.0.0.1:8087'
const {test}=require('node:test')
const assert=require('node:assert/strict')
const auth=require('../utils/auth')
test('登录保存、请求带 token、退出只清理账号',async()=>{
 let saved={};let header
 global.wx={getStorageSync:k=>saved[k],setStorageSync:(k,v)=>saved[k]=v,removeStorageSync:k=>delete saved[k],getAccountInfoSync:()=>({miniProgram:{envVersion:'develop'}}),login:o=>o.success({code:'wx_code'}),request:o=>{header=o.header;o.success({statusCode:200,data:{code:0,data:o.url.endsWith('/login')?{token:'token',userId:1,nickName:'海豚用户'}:null}})}}
 saved.kitchen='kept'
 await auth.login();assert.equal(auth.session().userId,1)
 await auth.logout();assert.equal(header.Authorization,'Bearer token');assert.equal(auth.session(),null);assert.equal(saved.kitchen,'kept')
})
test('微信失败不发请求、不保存假登录',async()=>{
 let requested=false
 global.wx={login:o=>o.fail(),request:()=>requested=true}
 await assert.rejects(auth.login(),/未完成/);assert.equal(requested,false)
})
test('401 清理过期登录态',async()=>{
 let value={token:'expired',userId:1,server:'http://127.0.0.1:8087'}
 global.wx={getStorageSync:()=>value,removeStorageSync:()=>value=null,getAccountInfoSync:()=>({miniProgram:{envVersion:'develop'}}),request:o=>o.success({statusCode:401,data:{code:401,msg:'登录已过期'}})}
 await assert.rejects(auth.refresh(),/过期/);assert.equal(auth.session(),null)
})
