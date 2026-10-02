const auth = require('../../utils/auth')
Page({
 data: { info: { name: '海豚带你做饭', slogan: '有啥做啥，好好吃饭。', email: '1174430282@qq.com', wechat: 'mistyMystery928' } },
 onLoad() { auth.request('/about', 'GET', {}, null).then(info => { if (info && ['name','slogan','email','wechat'].every(k => typeof info[k] === 'string' && info[k])) this.setData({ info }) }).catch(() => {}) },
 copyEmail() { wx.setClipboardData({ data: this.data.info.email }) },
 copyWechat() { wx.setClipboardData({ data: this.data.info.wechat }) }
})
