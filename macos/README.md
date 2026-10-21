# macOS Dock 应用（GDWLAN.app）

原生 AppKit 应用：状态窗口 + 每 15 秒检测 + 断网自动重登 + Dock 图标。

## 编译

```bash
swiftc -O main.swift -o GDWLAN.app/Contents/MacOS/GDWLAN
```

> 需先准备 `GDWLAN.app/Contents/Info.plist` 与图标（AppIcon.icns）。

## 开机自启（LaunchAgent）

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.gdwlan.autologin.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.gdwlan.autologin</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/GDWLAN.app/Contents/MacOS/GDWLAN</string>
    </array>
    <key>RunAtLoad</key><true/>
    <key>LimitLoadToSessionType</key><string>Aqua</string>
</dict>
</plist>
PLIST
launchctl load ~/Library/LaunchAgents/com.gdwlan.autologin.plist
```

> macOS Dock 应用与仓库核心（Node CLI）共用同一份配置 `~/.gdwlan/config.json`：
> 账号、密码、门户（留空则自动探测）、加密方式、检测间隔都从该文件读取。
