const cloud = require('./utils/cloud')
const catalog = require('./utils/catalog')
function refreshPage() {
 const pages = getCurrentPages()
 const page = pages[pages.length - 1]
 if (page && typeof page.refresh === 'function') page.refresh()
 else if (page && typeof page.refreshCounts === 'function') page.refreshCounts()
}
App({
 onLaunch() { catalog.restore(); cloud.onChange(refreshPage); if (wx.onNetworkStatusChange) wx.onNetworkStatusChange(res => { if (res.isConnected) cloud.sync().catch(() => {}) }) },
 onShow() { catalog.refresh().catch(() => {}).then(() => cloud.sync()).catch(() => {}).finally(refreshPage) }
})
