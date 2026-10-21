# Android 登录方式

三种方式任选。

## 1. Termux 脚本（最简单）

见 [gdwlan.sh](gdwlan.sh)：填好 4 个值后 `sh gdwlan.sh`。

## 2. MacroDroid（连上 WiFi 自动登录）

1. 新建宏，触发器选「WiFi 状态改变 → 已连接，SSID = 你的校园 WiFi」
2. 动作选「HTTP GET/POST」：
   - 方法：`POST`
   - URL：`https://<portal>/ac_portal/login.php`
   - 请求体：`opr=pwdLogin&userName=<学号>&pwd=<生成的pwd>&auth_tag=<生成的auth_tag>&rememberPwd=1`
3. 保存

## 3. Tasker

1. 新建配置：状态 → 网络 → WiFi 已连接（SSID）
2. 新建任务：动作「HTTP Request」，Method 选 `POST`，URL / Body 同上
3. 保存

> 注：MacroDroid / Tasker 内置 HTTP 动作不便计算 RC4，因此用固定 auth_tag 方案（值来自
> `generate-static-login.js`）。若需运行时加密，请用 Termux 安装 Node 跑完整 CLI：
> `pkg install nodejs git && git clone <仓库> && node src/index.js login`。
