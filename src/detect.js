const { getStatus, request } = require('./network');

// 从重定向 Location 中解析门户 origin（如 https://v.sut.edu.cn:444）
function portalFromLocation(loc) {
  if (!loc) return null;
  try {
    const u = new URL(loc);
    if (/ac_portal|portal|login|auth|srun/i.test(loc)) return u.origin;
  } catch {}
  return null;
}

// 通过向多个公网探针发请求、观察是否被门户劫持/重定向来发现门户地址
async function detectPortal(checkUrls, timeout) {
  for (const url of checkUrls) {
    try {
      const res = await request(url, { method: 'GET', timeout });
      // 被门户重定向（302）→ 从 Location 拿到门户地址
      const loc = res.headers.location;
      const origin = portalFromLocation(loc);
      if (origin) return origin;
      // 若已联网（204/200），说明当前无需认证，返回 null
      if (res.status === 204) return null;
    } catch (e) {
      // 忽略单个探针失败，继续尝试下一个
    }
  }
  return null;
}

// 判断是否已联网（已认证）
async function isOnline(checkUrls, timeout) {
  for (const url of checkUrls) {
    try {
      const s = await getStatus(url, timeout);
      if (s === 204) return true;
    } catch {}
  }
  return false;
}

module.exports = { detectPortal, isOnline };
