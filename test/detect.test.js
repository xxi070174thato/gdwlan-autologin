const { test } = require('node:test');
const assert = require('node:assert');
const { portalFromLocation } = require('../src/detect');

test('从门户重定向 URL 提取 origin（域名）', () => {
  assert.strictEqual(
    portalFromLocation('https://v.sut.edu.cn:444/ac_portal/proxy.html?template=1'),
    'https://v.sut.edu.cn:444'
  );
});

test('从 IP 门户地址提取 origin', () => {
  assert.strictEqual(
    portalFromLocation('http://10.91.200.211:444/ac_portal/login.php'),
    'http://10.91.200.211:444'
  );
});

test('非门户 URL 返回 null', () => {
  assert.strictEqual(portalFromLocation('https://example.com/'), null);
  assert.strictEqual(portalFromLocation(null), null);
  assert.strictEqual(portalFromLocation('not a url'), null);
});
