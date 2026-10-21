// Scriptable 版校园网登录（iOS）
// 优势：运行时 RC4（每次用当前时间戳作密钥），不依赖固定 auth_tag，比快捷指令更可靠。
// 用法：
//   1. 安装 Scriptable App（App Store）
//   2. 新建脚本，粘贴本文件，填好下方配置
//   3. 可直接运行，或「添加到主屏幕」一键登录
const USERNAME = "你的学号";
const PASSWORD = "你的密码";
const PORTAL = "https://你的门户地址"; // 必填，如 https://v.sut.edu.cn:444

function rc4Hex(src, key) {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }
  let i = 0;
  j = 0;
  let out = "";
  for (let k = 0; k < src.length; k++) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
    out += (src.charCodeAt(k) ^ s[(s[i] + s[j]) & 0xff]).toString(16).padStart(2, "0");
  }
  return out;
}

async function main() {
  const ts = String(Date.now());
  const pwd = rc4Hex(PASSWORD, ts);
  const body = "opr=pwdLogin&userName=" + USERNAME + "&pwd=" + pwd + "&auth_tag=" + ts + "&rememberPwd=1";
  const req = new Request(PORTAL + "/ac_portal/login.php");
  req.method = "POST";
  req.headers = { "Content-Type": "application/x-www-form-urlencoded" };
  req.body = body;
  try {
    const json = await req.loadJSON();
    const ok = json && (json.success === true || json.success === 1 || json.success === "1" || json.success === "true");
    const n = new Notification();
    n.title = ok ? "校园网登录成功 ✅" : "校园网登录失败 ❌";
    n.body = (json && json.msg) || (ok ? "已登录" : "未知错误");
    n.sound = "default";
    n.schedule();
  } catch (e) {
    const n = new Notification();
    n.title = "校园网登录出错";
    n.body = String(e);
    n.schedule();
  }
}

main().then(() => Script.complete());
