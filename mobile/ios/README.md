# iOS 快捷指令（Shortcuts）

用「快捷指令」App 做校园网一键登录，可放到桌面/负一屏，点一下即登录。

## 前提

先在电脑上运行 `node scripts/generate-static-login.js`，拿到 4 个值：`userName` / `pwd` / `auth_tag` / `portal`。

## 制作步骤

1. 打开「快捷指令」App → 右上角 `+` 新建
2. 添加动作「获取 URL 内容」：
   - **URL**：`https://<portal>/ac_portal/login.php`
   - **方法**：改为 `POST`
   - **请求体**：选「表单」，添加 5 个字段：
     - `opr` = `pwdLogin`
     - `userName` = 你的学号
     - `pwd` = 生成的 pwd
     - `auth_tag` = 生成的 auth_tag
     - `rememberPwd` = `1`
3. （可选）加动作「显示结果」，展示返回内容
4. 命名为「校园网登录」，保存

## 常见问题

- **SSL 报错**：门户是自签名证书，部分 iOS 版本「获取 URL 内容」会拒绝。可尝试把 https 换成 http（若门户支持），
  或改用 [Scriptable](https://scriptable.app/) 等可运行 JS 的 App 发请求。
- **固定 auth_tag 登录失败**：说明你的门户校验了时间戳新鲜度，请改用桌面端 Node CLI（每次用当前时间戳）。
