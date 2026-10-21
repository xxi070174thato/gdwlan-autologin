import http from '@ohos.net.http';

// 校园网登录（HarmonyOS ArkTS）
// 把下面 4 个常量替换为 generate-static-login.js 的输出，调用 login() 即可。
const USERNAME = '你的学号';
const PWD = 'RC4加密后的密码';
const AUTH_TAG = '6';
const PORTAL = 'https://你的门户地址';

export async function login(): Promise<string> {
  const httpRequest = http.createHttp();
  const body = 'opr=pwdLogin&userName=' + USERNAME + '&pwd=' + PWD + '&auth_tag=' + AUTH_TAG + '&rememberPwd=1';
  try {
    const resp = await httpRequest.request(PORTAL + '/ac_portal/login.php', {
      method: http.RequestMethod.POST,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      extraData: body,
      expectDataType: http.HttpDataType.STRING,
    });
    console.info('[gdwlan] 登录结果: ' + resp.result);
    return resp.result as string;
  } catch (e) {
    console.error('[gdwlan] 登录失败: ' + JSON.stringify(e));
    return '';
  } finally {
    httpRequest.destroy();
  }
}
