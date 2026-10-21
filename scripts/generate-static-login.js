#!/usr/bin/env node
// 生成「静态登录」数据：用固定 auth_tag 预先算好 RC4 密码，
// 使 iOS / 安卓 / 鸿蒙 等难以运行时加密的平台，只需发一次固定表单的 POST。
const { loadConfig } = require('../src/config');
const { rc4Hex } = require('../src/rc4');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const o = { authTag: '6', config: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--auth-tag' && argv[i + 1]) { o.authTag = argv[i + 1]; i++; }
    else if (argv[i] === '--config' && argv[i + 1]) { o.config = argv[i + 1]; i++; }
    else if (argv[i] === '--out' && argv[i + 1]) { o.out = argv[i + 1]; i++; }
  }
  return o;
}

const o = parseArgs(process.argv.slice(2));
const config = loadConfig(o.config);
if (!config.username || !config.password) {
  console.error('错误：请先在 ~/.gdwlan/config.json 填写 username / password');
  process.exit(1);
}
const pwd = rc4Hex(config.password, o.authTag);
const portal = config.portal || 'https://你的门户地址';
const url = portal + config.loginPath;
const body = 'opr=pwdLogin&userName=' + config.username + '&pwd=' + pwd + '&auth_tag=' + o.authTag + '&rememberPwd=1';

const result = { username: config.username, pwd: pwd, auth_tag: o.authTag, portal: portal, url: url, body: body };

if (o.out) {
  fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
  fs.writeFileSync(o.out, JSON.stringify(result, null, 2) + '\n');
  console.error('已写入: ' + o.out);
}

console.log(JSON.stringify(result, null, 2));
console.log('--- curl 命令 ---');
console.log('curl -s -k -d "' + body + '" "' + url + '"');
console.log('--- iOS 快捷指令「获取 URL 内容」表单字段 ---');
console.log('方法: POST    URL: ' + url);
console.log('opr = pwdLogin');
console.log('userName = ' + config.username);
console.log('pwd = ' + pwd);
console.log('auth_tag = ' + o.authTag);
console.log('rememberPwd = 1');
