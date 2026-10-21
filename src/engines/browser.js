// 无头浏览器通用登录引擎（Playwright）
// 适用于任意 Web 认证门户：由门户自身的 JS 完成加密，通用性最强。
// 需先安装: npm i playwright && npx playwright install chromium

let cached = null;
function getPlaywright() {
  if (cached) return cached;
  try {
    cached = require('playwright');
  } catch (e) {
    throw new Error('未安装 playwright。请先执行: npm i playwright && npx playwright install chromium');
  }
  return cached;
}

// 启发式定位登录表单元素，可被 config.browser.* 覆盖
async function findFields(page, cfg) {
  const b = cfg.browser || {};
  const pw = b.passwordSelector
    ? await page.locator(b.passwordSelector).first()
    : page.locator('input[type="password"]').first();
  await pw.waitFor({ state: 'attached', timeout: 10000 });

  // 用户名：优先自定义选择器，否则取密码框之前最近的文本输入框
  let un;
  if (b.usernameSelector) {
    un = page.locator(b.usernameSelector).first();
  } else {
    const candidates = page.locator('input[type="text"], input[type="tel"], input:not([type])');
    const n = await candidates.count();
    for (let i = 0; i < n; i++) {
      const el = candidates.nth(i);
      const visible = await el.isVisible().catch(() => false);
      const type = await el.getAttribute('type').catch(() => '');
      if (visible && type !== 'password') { un = el; break; }
    }
  }
  if (!un) throw new Error('未能定位用户名输入框，请在 config.browser.usernameSelector 指定选择器');

  // 提交按钮：自定义选择器 > 按文字 > 通用 type=submit/button
  let submit;
  if (b.submitSelector) {
    submit = page.locator(b.submitSelector).first();
  } else if (b.submitText) {
    submit = page.locator(`button:has-text("${b.submitText}"), input[type="submit"][value*="${b.submitText}"], input[type="button"][value*="${b.submitText}"]`).first();
  } else {
    submit = page.locator('button[type="submit"], input[type="submit"], .login_btn input, #password_submitBtn, [onclick*="ogin"]').first();
  }
  return { un, pw, submit };
}

async function browserLogin(config, portal) {
  const { chromium } = getPlaywright();
  const browser = await chromium.launch({ headless: config.browser?.headless !== false });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  try {
    await page.goto(portal, { waitUntil: 'domcontentloaded', timeout: config.timeout });
    const { un, pw, submit } = await findFields(page, config);
    await un.fill(config.username);
    await pw.fill(config.password);
    await submit.click();
    await page.waitForTimeout(2000);

    const content = await page.content();
    const loggedIn = /logout|退出|success|成功|已登录/i.test(content) && !/密码错误|账号|认证失败|错误/i.test(content);
    return { success: loggedIn, msg: loggedIn ? 'browser 引擎已提交登录（请以是否能上网为准）' : 'browser 引擎已提交，但未检测到明确成功标记', engine: 'browser', url: portal };
  } finally {
    await browser.close();
  }
}

module.exports = { browserLogin };
