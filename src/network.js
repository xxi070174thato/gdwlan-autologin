const http = require('http');
const https = require('https');

// 发送一次 HTTP 请求（默认忽略证书错误，适配门户自签名证书）
function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
      rejectUnauthorized: false,
      timeout: opts.timeout || 12000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// POST 表单（application/x-www-form-urlencoded）
function postForm(url, params, timeout) {
  const body = new URLSearchParams(params).toString();
  return request(url, {
    method: 'POST',
    timeout,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  });
}

// GET 并返回状态码（不跟随重定向，用于探测是否已联网）
function getStatus(url, timeout) {
  return request(url, { method: 'GET', timeout }).then((r) => r.status);
}

module.exports = { request, postForm, getStatus };
