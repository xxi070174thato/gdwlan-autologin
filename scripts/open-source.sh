#!/bin/bash
# 一键开源脚本：登录 gh 并创建公开仓库 + 推送
set -e
cd "$(dirname "$0")/.."

echo ">>> 第 1 步：登录 GitHub CLI"
echo "    请依次选择：GitHub.com -> HTTPS -> Paste an authentication token"
gh auth login --hostname github.com --git-protocol https

echo ""
echo ">>> 第 2 步：创建公开仓库并推送（仓库名 gdwlan-autologin）"
gh repo create gdwlan-autologin --public --source=. --remote=origin --push

echo ""
echo ">>> 完成！仓库已开源："
gh repo view --web 2>/dev/null || echo "(打开你的 GitHub 主页查看)"
