const { test } = require('node:test')
const assert = require('node:assert/strict')
const auth = require('../utils/auth')
test('真机连接错误保留原因，区分域名、TLS和超时，不谎报已保存', async () => {
 for (const [errMsg, expected] of [['request:fail url not in domain list', /合法域名/], ['request:fail ssl hand shake error', /HTTPS/], ['request:fail timeout', /超时/]]) {
  global.wx = { getStorageSync: () => null, getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }), request: o => o.fail({ errMsg }) }
  await assert.rejects(auth.request('/user/login', 'POST', { code: 'not-logged' }), e => e.network && expected.test(e.message) && e.detail === errMsg && !e.message.includes('已保存'))
 }
})
