const { postForm } = require('../network');
const { rc4Hex } = require('../rc4');

// 计算加密后的密码
function encryptPassword(config, ts) {
  if (config.encryption === 'rc4') {
    return rc4Hex(config.password, ts);
  }
  if (config.encryption === 'plain') {
    return config.password;
  }
  throw new Error(`不支持的加密方式: ${config.encryption}（可选 rc4 / plain，其它请用 browser 引擎）`);
}

// 构造登录表单参数（纯函数，便于单元测试）
function buildLoginParams(config, ts) {
  const f = config.form;
  const params = {};
  params[f.oprField] = f.oprValue;
  params[f.userField] = config.username;
  params[f.pwdField] = encryptPassword(config, ts);
  params[f.authTagField] = ts;
  if (f.rememberValue !== undefined && f.rememberValue !== '') {
    params[f.rememberField] = f.rememberValue;
  }
  return params;
}

// 城市热点/广州热点 ePortal 直连登录引擎（无需浏览器，轻量）
async function curlLogin(config, portal) {
  const ts = String(Date.now()); // 13 位毫秒时间戳，作为 RC4 密钥与 auth_tag
  const params = buildLoginParams(config, ts);
  const url = portal + config.loginPath;
  const res = await postForm(url, params, config.timeout);

  let success = false;
  let msg = res.body;
  try {
    const o = JSON.parse(res.body);
    if (o && 'success' in o) {
      const v = o.success;
      success = v === true || v === 1 || v === '1' || v === 'true';
    }
    if (o && o.msg) msg = o.msg;
  } catch {}
  return { success, msg, engine: 'curl', url };
}

module.exports = { curlLogin, buildLoginParams, encryptPassword };
