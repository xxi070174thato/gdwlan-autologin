# 移动端适配（iOS / Android / HarmonyOS）

核心思路：门户的 `auth_tag` 可以是任意固定值，因此可把密码用固定 auth_tag 预先做一次 RC4 加密，
得到一个**固定的 pwd + auth_tag**。移动端只需发一次固定表单的 POST，运行时无需加密算法。

> ⚠️ 说明：本方案依赖门户「auth_tag 可为任意值」的特性。若你的学校校验了时间戳新鲜度，
> 固定 auth_tag 会失败，此时请改用桌面端 Node CLI（每次用当前时间戳做 RC4）。

## 第一步：生成静态登录数据

在电脑上（已填好 `~/.gdwlan/config.json`）：

```bash
node scripts/generate-static-login.js
```

输出含 4 个关键值：`userName` / `pwd` / `auth_tag` / `portal`。

可选参数：

```bash
node scripts/generate-static-login.js --auth-tag 6 --out mobile/static-login.json
```

- `--auth-tag`：固定 auth_tag 值（默认 `6`）
- `--out`：把结果保存为 JSON 文件

## 各平台入口

| 平台 | 文件 | 说明 |
|------|------|------|
| iOS | [mobile/ios/README.md](../mobile/ios/README.md) | 快捷指令（Shortcuts） |
| iOS | [mobile/ios/gdwlan-login.js](../mobile/ios/gdwlan-login.js) | Scriptable 脚本（运行时 RC4） |
| Android | [mobile/android/README.md](../mobile/android/README.md) | Termux / MacroDroid / Tasker |
| HarmonyOS | [mobile/harmonyos/GdwlanLogin.ets](../mobile/harmonyos/GdwlanLogin.ets) | ArkTS 登录函数 |

## Android 进阶（完整功能）

Android 用户若在 Termux 里安装了 Node，可直接复用完整 CLI（运行时 RC4 + 门户自动探测 + 守护模式）：

```bash
pkg install nodejs git
git clone https://github.com/xxi070174thato/gdwlan-autologin.git
cd gdwlan-autologin && cp config.example.json ~/.gdwlan/config.json
node src/index.js login
```
