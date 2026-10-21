const { loadConfig } = require('./config');
const { detectPortal, isOnline } = require('./detect');
const { curlLogin } = require('./engines/curl');

const HELP = `
gdwlan —— 跨平台校园网 Web 认证自动登录工具

用法:
  gdwlan login                 登录一次（自动探测门户 + 按配置引擎登录）
  gdwlan daemon                守护模式：定时检测，断网自动重登
  gdwlan detect                只探测并打印当前认证门户地址
  gdwlan --config <path> ...   指定配置文件（默认 ./config.json 或 ~/.gdwlan/config.json）

示例:
  gdwlan login
  gdwlan daemon --config ~/.gdwlan/config.json
`;

async function resolvePortal(config) {
  if (config.portal) return config.portal.replace(/\/$/, '');
  const origin = await detectPortal(config.checkUrls, config.timeout);
  if (!origin) throw new Error('未探测到认证门户。请确认已连接校园 WiFi，或在 config.json 里手动填写 portal。');
  return origin;
}

async function doLogin(config) {
  const portal = await resolvePortal(config);
  const engine = config.engine === 'auto'
    ? 'curl'
    : config.engine;

  if (engine === 'curl') {
    return curlLogin(config, portal);
  }
  if (engine === 'browser') {
    const { browserLogin } = require('./engines/browser');
    return browserLogin(config, portal);
  }
  throw new Error(`未知引擎: ${engine}`);
}

async function cmdLogin(config) {
  const r = await doLogin(config);
  console.log(`[gdwlan] ${r.success ? '✅ 登录成功' : '❌ 登录失败'} (引擎: ${r.engine})`);
  console.log(`[gdwlan] ${r.msg}`);
  return r.success ? 0 : 1;
}

async function cmdDaemon(config) {
  console.log(`[gdwlan] 守护模式启动，每 ${config.interval} 秒检测一次 (Ctrl+C 退出)`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const online = await isOnline(config.checkUrls, config.timeout);
      if (online) {
        console.log(`[${new Date().toLocaleTimeString()}] 已联网，无需登录`);
      } else {
        const r = await doLogin(config);
        console.log(`[${new Date().toLocaleTimeString()}] ${r.success ? '✅ 登录成功' : '❌ 登录失败'} — ${r.msg}`);
      }
    } catch (e) {
      console.error(`[${new Date().toLocaleTimeString()}] 出错: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, config.interval * 1000));
  }
}

async function cmdDetect(config) {
  const online = await isOnline(config.checkUrls, config.timeout);
  if (online) {
    console.log('当前已联网（已认证），无需登录。');
    return 0;
  }
  const origin = await detectPortal(config.checkUrls, config.timeout);
  console.log(origin ? `探测到认证门户: ${origin}` : '未探测到门户。');
  return origin ? 0 : 1;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    console.log(HELP);
    return 0;
  }
  let configPath = null;
  const ci = args.indexOf('--config');
  if (ci >= 0 && args[ci + 1]) {
    configPath = args[ci + 1];
    args.splice(ci, 2);
  }
  const cmd = args[0];
  const config = loadConfig(configPath);

  if ((cmd === 'login' || cmd === 'daemon') && (!config.username || !config.password)) {
    console.error('错误: 请在配置文件中填写 username 和 password（参考 config.example.json）');
    return 1;
  }

  switch (cmd) {
    case 'login': return cmdLogin(config);
    case 'daemon': return cmdDaemon(config);
    case 'detect': return cmdDetect(config);
    default:
      console.log(HELP);
      return 1;
  }
}

main().then((code) => process.exit(code)).catch((e) => {
  console.error('错误: ' + e.message);
  process.exit(1);
});
