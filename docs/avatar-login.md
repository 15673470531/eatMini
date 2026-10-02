# 登录与头像（chooseAvatar）设计说明

小程序「我的」页的登录/头像实现。原先登录只调用 `wx.login` 换 code，没有任何头像；现在
用户点头像（未登录时点「微信登录」）会调起微信头像选择面板，可以用**微信头像**、**相册照片**或**拍照**，
选完自动登录并把头像上传到服务端，换设备也能看到。

## 为什么这样做

微信从 2022-10-25 起，`wx.getUserProfile` / `wx.getUserInfo` 只能拿到灰色默认头像和「微信用户」，
要让用户自己挑头像只能用官方「头像昵称填写能力」：

```xml
<button open-type="chooseAvatar" bindchooseavatar="chooseAvatar">微信登录</button>
```

回调 `e.detail.avatarUrl` **是本机临时文件路径**（开发者工具是 `http://tmp/...`，真机是 `wxfile://...`），
微信会定期清理。所以必须上传到服务端换成一个稳定地址，否则换设备/清缓存后就是裂图
（另一个项目 money 就是直接把临时路径存库了，只有当场看着正常）。

## 后端

- `POST /api/user/avatar`（需登录，`auth:sanctum`，限流 30/分钟）
  - 表单字段 `file`，校验 `required|image|mimes:jpeg,jpg,png,webp|max:2048`
  - 存到 `public` 磁盘 `avatars/` 目录，`users.avatar_url` 只存**相对路径**（`avatars/xxx.jpg`）
  - 换头像时删除旧文件；失败时不动原头像
  - 返回最新资料
- `/api/user/login`、`/api/user/info` 下发的 `avatarUrl` 统一是**站点相对路径** `/storage/avatars/xxx.jpg`
  - 后端不需要知道自己的公网域名（生产是外层 nginx 反代到容器，后端看到的 host 是 127.0.0.1）
  - 小程序用自己配置的 `baseUrl` 拼成完整地址，开发机（127.0.0.1 / 局域网 IP）和生产域名都不用改配置
- 微信登录本身不写头像：新用户 `avatar_url` 为 NULL，前端显示默认 🐬

## 前端

- `utils/auth.js`
  - `absoluteUrl(path)`：相对地址补 `baseUrl`，绝对地址原样返回
  - `uploadAvatar(filePath)`：`wx.uploadFile` 上传，带 Bearer Token；成功后写回本地会话
- `pages/mine/mine.js`
  - `signIn()`：`wx.login` + 账号数据同步（不含头像）
  - `chooseAvatar(e)`：未登录先 `signIn()` 再上传；已登录只上传
  - `refreshCounts()`：把 `avatarUrl` 拼成完整地址放进 `data.avatar`
- `pages/mine/mine.wxml`
  - 未登录：主按钮 `open-type="chooseAvatar"`（微信登录）+ 下方「跳过头像，直接登录」兜底
    （用户在选择面板点取消时不会触发回调，必须留一条不选头像也能登录的路）
  - 已登录：头像块本身是 `open-type="chooseAvatar"` 按钮，右下角 ✏️ 提示可点更换

## 布局坑（本次踩到）

- 头像块是 `<button open-type="chooseAvatar">`，而**微信 button 默认宽 184px，class 里的 `width` 压不住**（`height` 却生效）
  → 头像被拉成横长条。宽高、内边距、display 必须写在 wxml 的内联 style 里，class 只放背景和圆角。
- 验证方式：量盒子应该是 54×54px（108rpx），不是 184×54px —— 别只看截图。

## 微信侧需要手动配置（否则真机不生效）

1. 小程序后台 → 开发管理 → 服务器域名：
   - `uploadFile 合法域名` 加生产域名（`https://eat.guozeshui.top`）
   - `downloadFile 合法域名` 加同一个域名（`<image>` 加载网络图片要过这条）
2. 小程序后台 → 用户隐私保护指引：确认已声明「用户信息（头像、昵称）」，否则真机可能不弹面板

## 发布顺序与影响

1. 先发后端：纯新增接口 + `avatarUrl` 由「原样返回」改为「站点相对路径」。
   老数据 `avatar_url` 全是 NULL → 返回 null → 前端显示 🐬，无行为变化，不需要迁移。
2. 服务器上执行一次 `php artisan storage:link`
   （`public/storage` 在 .gitignore 里，服务器上大概率还没有这个软链，没有它头像会 404）。
3. 再提交小程序审核发版。前端先上线也不致命：后端没更新时上传会失败并提示，
   但登录和其他功能照常。

## 验证

- `php vendor/bin/phpunit`：`tests/Feature/UserAvatarTest.php`（未登录 401、落库与相对地址、换头像删旧文件、非图片 422、登录不写头像）
- `node --test tests/`：`tests/avatar.test.js`（未登录先登录再上传、已登录只上传、上传失败保留原头像、401 清登录态、跳过头像登录、地址拼接）
- 本地 `curl -I http://127.0.0.1:8087/storage/qrcode.jpg` 返回 200，证明 `/storage/...` 可被 nginx 直接服务
