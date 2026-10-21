# gdwlan-autologin

跨平台校园网 Web 认证自动登录工具。

连上校园 WiFi 后，自动检测认证门户、完成登录，并在断网/掉线时自动重连。开箱即用，也支持为不同学校/不同认证体系灵活配置。

## ✨ 特性

- 🔍 **门户自动探测**：无需手动找认证地址，连接校园 WiFi 后自动发现门户
- ⚡ **双登录引擎**
  - `curl` 直连：轻量、无浏览器依赖，覆盖「城市热点 / 广州热点 ePortal」体系（RC4 / 明文加密）
  - `browser` 无头浏览器：基于 Playwright，由门户自身 JS 完成加密，**任意认证门户通用**
- 🔁 **守护模式**：定时检测网络，断网自动重登
- 🖥️ **跨平台**：macOS / Linux / Windows（Node.js ≥ 18）
- ⚙️ **配置驱动**：账号、密码、门户、加密方式、表单字段均可配置

## 🚀 快速开始

### 1. 安装

```bash
git clone https://github.com/<你的用户名>/gdwlan-autologin.git
cd gdwlan-autologin
npm install            # 可选；仅 browser 引擎需要
npm link               # 可选；注册全局命令 gdwlan
```

> `curl` 引擎零依赖，无需 `npm install` 也能直接 `node src/index.js` 运行。

### 2. 配置

复制示例配置并填入你的账号密码：

```bash
cp config.example.json ~/.gdwlan/config.json
# 编辑 ~/.gdwlan/config.json，填写 username / password
```

最小配置（其余走默认值）：

```json
{
  "username": "你的学号",
  "password": "你的密码"
}
```

### 3. 使用

```bash
node src/index.js login     # 登录一次
node src/index.js daemon    # 守护模式：断网自动重登
node src/index.js detect    # 只探测门户地址
```

## ⚙️ 配置项

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `username` | — | 账号（学号） |
| `password` | — | 密码 |
| `portal` | `""` | 认证门户地址，留空则自动探测 |
| `loginPath` | `/ac_portal/login.php` | curl 引擎登录路径 |
| `checkUrls` | 三个公网探针 | 联网检测地址（返回 204 视为已联网） |
| `engine` | `auto` | 登录引擎：`auto` / `curl` / `browser` |
| `encryption` | `rc4` | curl 引擎加密：`rc4` / `plain` |
| `interval` | `15` | 守护模式检测间隔（秒） |
| `timeout` | `12000` | 请求超时（毫秒） |
| `form.*` | — | curl 引擎表单字段名（适配不同门户） |
| `browser.*` | — | browser 引擎选择器覆盖 |

完整示例见 [config.example.json](config.example.json)。

## 🧠 双引擎说明

### curl 引擎（默认，推荐先试）

针对「城市热点 / 广州热点 ePortal」这一高校常见认证体系，直接 POST 到
`<portal>/ac_portal/login.php`，密码用毫秒时间戳作密钥做 RC4 加密。

- 优点：极轻量、无依赖、速度快
- 适用：大多数使用 ePortal 体系的高校（字段名 `opr/userName/pwd/auth_tag`）
- 若你学校字段不同，通过 `form.*` 调整；若加密不是 RC4，改用 browser 引擎

### browser 引擎（通用兜底）

用 Playwright 启动无头 Chromium，加载门户页面，由页面自身 JS 完成加密后自动填表提交。

- 优点：任意 Web 认证门户通用，无需逆向加密算法
- 缺点：需安装 Chromium（约 150MB）

```bash
npm i playwright && npx playwright install chromium
```

配置 `"engine": "browser"`，必要时用 `browser.usernameSelector` 等指定表单选择器。

## 🖥️ macOS 开机自启（Dock 应用）

本仓库提供 macOS 原生 Dock 应用（状态窗口 + 自动重登），源码见 `macos/`，可编译为
`GDWLAN.app` 并通过 LaunchAgent 开机自启。详见 [macos/README.md](macos/README.md)。

## 🤝 适配你自己的学校

1. 连上校园 WiFi，运行 `node src/index.js detect` 查看探测到的门户地址
2. 填入 `config.json` 的 `username` / `password`（必要时填 `portal`）
3. 先 `node src/index.js login` 试一次：
   - 成功 → 完成，用 `daemon` 常驻即可
   - 失败 → 改用 `"engine": "browser"` 再试
4. 欢迎把你学校的适配方案以 PR 形式提交

## 📄 许可

[MIT](LICENSE)

---

## English

A cross-platform auto-login tool for campus-network Web authentication (captive portal).

- Auto-detects the portal after connecting to campus WiFi
- Two login engines: lightweight `curl` (for the common ePortal / CityHotspot system,
  RC4/plain encryption) and a Playwright headless `browser` engine (works with any portal)
- Daemon mode: periodically checks connectivity and re-logs-in on disconnection
- Config-driven; runs on macOS / Linux / Windows with Node.js ≥ 18

```bash
git clone https://github.com/<your-username>/gdwlan-autologin.git
cd gdwlan-autologin
cp config.example.json ~/.gdwlan/config.json   # fill in username/password
node src/index.js login
node src/index.js daemon
```

See [config.example.json](config.example.json) for all options. MIT licensed.
