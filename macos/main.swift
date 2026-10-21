import AppKit
import Foundation

// ===================== 运行时配置（从 ~/.gdwlan/config.json 读取，与 Node CLI 共用） =====================
struct RuntimeConfig {
    var username = ""
    var password = ""
    var portal = ""                       // 留空则自动探测
    var loginPath = "/ac_portal/login.php"
    var encryption = "rc4"                // rc4 | plain
    var interval: TimeInterval = 15
    var checkURL = "http://connect.rom.miui.com/generate_204"
}

func loadRuntimeConfig() -> RuntimeConfig {
    var c = RuntimeConfig()
    let home = FileManager.default.homeDirectoryForCurrentUser
    let path = home.appendingPathComponent(".gdwlan/config.json").path
    guard FileManager.default.fileExists(atPath: path),
          let data = try? Data(contentsOf: URL(fileURLWithPath: path)),
          let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
        return c
    }
    c.username = obj["username"] as? String ?? ""
    c.password = obj["password"] as? String ?? ""
    c.portal = obj["portal"] as? String ?? ""
    c.loginPath = obj["loginPath"] as? String ?? c.loginPath
    c.encryption = obj["encryption"] as? String ?? c.encryption
    c.interval = (obj["interval"] as? NSNumber)?.doubleValue ?? c.interval
    if let urls = obj["checkUrls"] as? [String], let first = urls.first {
        c.checkURL = first
    }
    return c
}

// ===================== RC4（与门户 do_encrypt_rc4 一致，输出小写 hex） =====================
func rc4Hex(_ src: String, _ key: String) -> String {
    let sBytes = Array(src.utf8)
    let kBytes = Array(key.utf8)
    var s = Array(0...255)
    var j = 0
    for i in 0..<256 {
        j = (j + s[i] + Int(kBytes[i % kBytes.count])) & 0xff
        s.swapAt(i, j)
    }
    var i = 0
    j = 0
    var out = ""
    for c in sBytes {
        i = (i + 1) & 0xff
        j = (j + s[i]) & 0xff
        s.swapAt(i, j)
        let k = s[(s[i] + s[j]) & 0xff]
        out += String(format: "%02x", Int(c) ^ k)
    }
    return out
}

// ===================== curl 调用 =====================
func runCurl(_ args: [String]) -> (Int32, String) {
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/usr/bin/curl")
    p.arguments = args
    let outPipe = Pipe()
    p.standardOutput = outPipe
    p.standardError = Pipe()
    do { try p.run() } catch { return (-1, "") }
    p.waitUntilExit()
    let data = outPipe.fileHandleForReading.readDataToEndOfFile()
    let text = String(data: data, encoding: .utf8) ?? ""
    return (p.terminationStatus, text)
}

func checkOnline(_ checkURL: String) -> Bool {
    let (_, code) = runCurl(["-s", "-m", "8", "-o", "/dev/null", "-w", "%{http_code}", checkURL])
    return code == "204"
}

// 从重定向 Location 自动探测门户 origin
func detectPortal(_ checkURL: String) -> String? {
    let (_, loc) = runCurl(["-s", "-m", "8", "-o", "/dev/null", "-w", "%{redirect_url}", checkURL])
    let t = loc.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !t.isEmpty, let u = URL(string: t),
          let scheme = u.scheme, let host = u.host else { return nil }
    let isPortal = t.range(of: "ac_portal", options: .caseInsensitive) != nil
        || t.range(of: "portal", options: .caseInsensitive) != nil
        || t.range(of: "login", options: .caseInsensitive) != nil
    guard isPortal else { return nil }
    let port = u.port.map { ":\($0)" } ?? ""
    return "\(scheme)://\(host)\(port)"
}

func encryptPassword(_ cfg: RuntimeConfig, _ ts: String) -> String {
    if cfg.encryption == "rc4" { return rc4Hex(cfg.password, ts) }
    return cfg.password
}

func doLogin(_ cfg: RuntimeConfig, _ portal: String) -> (Bool, String) {
    let ts = String(Int64(Date().timeIntervalSince1970 * 1000))
    let enc = encryptPassword(cfg, ts)
    let body = "opr=pwdLogin&userName=\(cfg.username)&pwd=\(enc)&auth_tag=\(ts)&rememberPwd=1"
    let url = portal + cfg.loginPath
    let (_, text) = runCurl(["-s", "-m", "12", "-k", "-d", body, url])
    var success = false
    var msg = "无响应"
    if let data = text.data(using: .utf8),
       let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
        if let v = obj["success"] as? Bool { success = v }
        else if let v = obj["success"] as? Int { success = v != 0 }
        else if let v = obj["success"] as? String { success = (v == "true" || v == "1") }
        if let m = obj["msg"] as? String { msg = m }
    } else if !text.isEmpty { msg = text }
    return (success, msg)
}

// ===================== App =====================
final class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var statusLabel: NSTextField!
    var detailLabel: NSTextField!
    var timer: Timer?
    let workQueue = DispatchQueue(label: "gdwlan.work")
    var busy = false
    let cfg = loadRuntimeConfig()

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        buildWindow()
        if cfg.username.isEmpty || cfg.password.isEmpty {
            updateStatus("⚠️ 未找到配置", detail: "请在 ~/.gdwlan/config.json 中填写 username / password（参考 config.example.json）")
        } else {
            tick()
            timer = Timer.scheduledTimer(timeInterval: cfg.interval, target: self, selector: #selector(tick), userInfo: nil, repeats: true)
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { return false }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag { window.makeKeyAndOrderFront(nil) }
        return true
    }

    func buildMenu() {
        let mainMenu = NSMenu()
        let appItem = NSMenuItem()
        mainMenu.addItem(appItem)
        let appMenu = NSMenu()
        appItem.submenu = appMenu
        let name = "GD-WLAN 自动登录"
        appMenu.addItem(withTitle: "关于 \(name)", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "隐藏 \(name)", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "退出 \(name)", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        NSApp.mainMenu = mainMenu
    }

    func buildWindow() {
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 400, height: 190),
                          styleMask: [.titled, .closable, .miniaturizable],
                          backing: .buffered, defer: false)
        window.title = "GD-WLAN 自动登录"
        window.isReleasedWhenClosed = false
        window.center()

        let content = NSView()
        let titleLabel = NSTextField(labelWithString: "GD-WLAN 校园网自动登录")
        titleLabel.font = NSFont.boldSystemFont(ofSize: 16)

        statusLabel = NSTextField(labelWithString: "正在初始化…")
        statusLabel.font = NSFont.systemFont(ofSize: 14)

        detailLabel = NSTextField(wrappingLabelWithString: "")
        detailLabel.font = NSFont.systemFont(ofSize: 12)
        detailLabel.textColor = .secondaryLabelColor

        let loginBtn = NSButton(title: "立即登录", target: self, action: #selector(loginNow))
        let quitBtn = NSButton(title: "退出", target: self, action: #selector(quitApp))

        let views: [NSView] = [titleLabel, statusLabel, detailLabel, loginBtn, quitBtn]
        for v in views {
            v.translatesAutoresizingMaskIntoConstraints = false
            content.addSubview(v)
        }
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: content.topAnchor, constant: 18),
            titleLabel.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 18),

            statusLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 14),
            statusLabel.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 18),
            statusLabel.trailingAnchor.constraint(equalTo: content.trailingAnchor, constant: -18),

            detailLabel.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 8),
            detailLabel.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 18),
            detailLabel.trailingAnchor.constraint(equalTo: content.trailingAnchor, constant: -18),

            loginBtn.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 18),
            loginBtn.bottomAnchor.constraint(equalTo: content.bottomAnchor, constant: -18),
            loginBtn.widthAnchor.constraint(equalToConstant: 120),

            quitBtn.trailingAnchor.constraint(equalTo: content.trailingAnchor, constant: -18),
            quitBtn.bottomAnchor.constraint(equalTo: content.bottomAnchor, constant: -18),
            quitBtn.widthAnchor.constraint(equalToConstant: 120),
        ])

        window.contentView = content
        window.makeKeyAndOrderFront(nil)
    }

    func resolvePortal() -> String? {
        if !cfg.portal.isEmpty { return cfg.portal }
        return detectPortal(cfg.checkURL)
    }

    @objc func tick() {
        guard !busy else { return }
        busy = true
        updateStatus("检测网络中…", detail: "")
        workQueue.async {
            if checkOnline(self.cfg.checkURL) {
                DispatchQueue.main.async {
                    self.busy = false
                    self.updateStatus("✅ 已连接并已认证", detail: "持续监控中（每 \(Int(self.cfg.interval)) 秒检测一次），断网会自动重登。")
                }
            } else if let portal = self.resolvePortal() {
                let (ok, msg) = doLogin(self.cfg, portal)
                DispatchQueue.main.async {
                    self.busy = false
                    if ok { self.updateStatus("✅ 登录成功", detail: msg) }
                    else { self.updateStatus("⚠️ 登录失败", detail: msg) }
                }
            } else {
                DispatchQueue.main.async {
                    self.busy = false
                    self.updateStatus("⚠️ 未探测到门户", detail: "请确认已连接校园 WiFi，或在 config.json 中手动填写 portal")
                }
            }
        }
    }

    @objc func loginNow() {
        guard !busy else { return }
        guard let portal = resolvePortal() else {
            updateStatus("⚠️ 未探测到门户", detail: "请在 config.json 中手动填写 portal")
            return
        }
        busy = true
        updateStatus("正在登录…", detail: "")
        workQueue.async {
            let (ok, msg) = doLogin(self.cfg, portal)
            DispatchQueue.main.async {
                self.busy = false
                if ok { self.updateStatus("✅ 登录成功", detail: msg) }
                else { self.updateStatus("⚠️ 登录失败", detail: msg) }
            }
        }
    }

    @objc func quitApp() {
        NSApp.terminate(nil)
    }

    func updateStatus(_ s: String, detail: String) {
        statusLabel.stringValue = s
        detailLabel.stringValue = detail
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)
app.run()
