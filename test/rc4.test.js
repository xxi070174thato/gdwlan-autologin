const { test } = require('node:test');
const assert = require('node:assert');
const { rc4Hex } = require('../src/rc4');

test('RC4 标准测试向量 Key/Plaintext', () => {
  assert.strictEqual(rc4Hex('Plaintext', 'Key'), 'bbf316e8d940af0ad3');
});

test('RC4 标准测试向量 Wiki/pedia', () => {
  assert.strictEqual(rc4Hex('pedia', 'Wiki'), '1021bf0420');
});

test('RC4 输出为小写十六进制、长度为偶数', () => {
  const out = rc4Hex('hello world', '1234567890123');
  assert.match(out, /^[0-9a-f]+$/);
  assert.strictEqual(out.length % 2, 0);
  assert.strictEqual(out.length, 'hello world'.length * 2);
});

test('RC4 结果依赖密钥（不同密钥结果不同）', () => {
  assert.notStrictEqual(rc4Hex('abc', 'key1'), rc4Hex('abc', 'key2'));
});
