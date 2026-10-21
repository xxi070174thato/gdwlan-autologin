const { test } = require('node:test');
const assert = require('node:assert');
const { buildLoginParams } = require('../src/engines/curl');
const { DEFAULTS } = require('../src/config');
const { rc4Hex } = require('../src/rc4');

function makeConfig(overrides) {
  return {
    ...DEFAULTS,
    form: { ...DEFAULTS.form },
    browser: { ...DEFAULTS.browser },
    ...overrides,
  };
}

test('rc4 模式：密码用时间戳作密钥 RC4 加密', () => {
  const cfg = makeConfig({ username: '261206303', password: 'abc', encryption: 'rc4' });
  const ts = '1234567890123';
  const p = buildLoginParams(cfg, ts);
  assert.strictEqual(p.opr, 'pwdLogin');
  assert.strictEqual(p.userName, '261206303');
  assert.strictEqual(p.auth_tag, ts);
  assert.strictEqual(p.rememberPwd, '1');
  assert.strictEqual(p.pwd, rc4Hex('abc', ts));
});

test('plain 模式：密码原样发送', () => {
  const cfg = makeConfig({ username: 'u', password: 'secret', encryption: 'plain' });
  const p = buildLoginParams(cfg, '999');
  assert.strictEqual(p.pwd, 'secret');
});

test('不支持的加密方式抛出错误', () => {
  const cfg = makeConfig({ username: 'u', password: 'p', encryption: 'md5' });
  assert.throws(() => buildLoginParams(cfg, '1'), /不支持的加密方式/);
});

test('自定义表单字段名生效', () => {
  const cfg = makeConfig({
    username: 'u', password: 'p',
    form: {
      oprField: 'action', oprValue: 'login',
      userField: 'user', pwdField: 'pass',
      authTagField: 'tag', rememberField: 'rm', rememberValue: '0',
    },
  });
  const p = buildLoginParams(cfg, 'ts');
  assert.strictEqual(p.action, 'login');
  assert.strictEqual(p.user, 'u');
  assert.strictEqual(p.pass, rc4Hex('p', 'ts'));
  assert.strictEqual(p.tag, 'ts');
  assert.strictEqual(p.rm, '0');
});
