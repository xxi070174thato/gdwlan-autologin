const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULTS = {
  username: '',
  password: '',
  portal: '',                                 // 留空则自动探测
  loginPath: '/ac_portal/login.php',
  checkUrls: [
    'http://connect.rom.miui.com/generate_204',
    'http://captive.apple.com/hotspot-detect.html',
    'http://www.msftconnecttest.com/connecttest.txt',
  ],
  engine: 'auto',                             // auto | curl | browser
  encryption: 'rc4',                          // rc4 | plain
  interval: 15,                               // 守护模式检测间隔（秒）
  timeout: 12000,
  form: {
    oprField: 'opr',
    oprValue: 'pwdLogin',
    userField: 'userName',
    pwdField: 'pwd',
    authTagField: 'auth_tag',
    rememberField: 'rememberPwd',
    rememberValue: '1',
  },
  browser: {
    headless: true,
    usernameSelector: '',                     // 自定义选择器，留空则自动猜测
    passwordSelector: '',
    submitSelector: '',
    submitText: '',                           // 按按钮文字匹配（如"登录"）
  },
};

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(base, extra) {
  const out = { ...base };
  for (const k of Object.keys(extra || {})) {
    if (isPlainObject(base[k]) && isPlainObject(extra[k])) out[k] = deepMerge(base[k], extra[k]);
    else out[k] = extra[k];
  }
  return out;
}

function resolveConfigPath(explicit) {
  if (explicit) return explicit;
  const candidates = [
    path.join(process.cwd(), 'config.json'),
    path.join(os.homedir(), '.gdwlan', 'config.json'),
  ];
  return candidates.find((c) => fs.existsSync(c)) || null;
}

function loadConfig(explicit) {
  const p = resolveConfigPath(explicit);
  let user = {};
  if (p) {
    try { user = JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch (e) { throw new Error(`无法解析配置文件 ${p}: ${e.message}`); }
  }
  const cfg = deepMerge(DEFAULTS, user);
  cfg.__path = p;
  return cfg;
}

module.exports = { loadConfig, DEFAULTS };
