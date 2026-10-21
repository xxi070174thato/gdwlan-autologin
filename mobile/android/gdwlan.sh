#!/system/bin/sh
# 校园网一键登录（Android Termux / adb shell 等 sh 环境）
# 把下面 4 个值替换为 generate-static-login.js 的输出
USERNAME="你的学号"
PWD="RC4加密后的密码"
AUTH_TAG="6"
PORTAL="https://你的门户地址"

BODY="opr=pwdLogin&userName=$USERNAME&pwd=$PWD&auth_tag=$AUTH_TAG&rememberPwd=1"
echo "正在登录 $PORTAL ..."
curl -s -k -d "$BODY" "$PORTAL/ac_portal/login.php"
echo ""
