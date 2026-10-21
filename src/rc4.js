// RC4 加密，输出小写 hex（与城市热点 ePortal 的 do_encrypt_rc4 一致）
// 密钥/明文仅支持 ASCII（中文账号请走 browser 引擎）
function rc4Hex(src, key) {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }
  let i = 0;
  j = 0;
  let out = '';
  for (let k = 0; k < src.length; k++) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
    out += (src.charCodeAt(k) ^ s[(s[i] + s[j]) & 0xff]).toString(16).padStart(2, '0');
  }
  return out;
}

module.exports = { rc4Hex };
