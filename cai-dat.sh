#!/usr/bin/env bash
# CÀI ĐẶT VĂN PHÒNG AGENT (macOS / Linux). Chạy: bash cai-dat.sh
set -e
cd "$(dirname "$0")"

echo "== CÀI ĐẶT VĂN PHÒNG AGENT 3D =="

if ! command -v node >/dev/null 2>&1; then
  echo "[1/3] Chưa có Node.js."
  if command -v brew >/dev/null 2>&1; then
    read -r -p "      Cài Node.js bằng Homebrew? (y/n) " ans
    [ "$ans" = "y" ] && brew install node
  fi
  if ! command -v node >/dev/null 2>&1; then
    echo "      Hãy cài Node.js 18+ tại https://nodejs.org rồi chạy lại: bash cai-dat.sh"
    exit 1
  fi
fi
node -e "process.exit(+process.versions.node.split('.')[0] >= 18 ? 0 : 1)" || { echo "Node.js quá cũ, cần bản 18+"; exit 1; }
echo "[1/3] Node.js $(node -v) - OK"

echo "[2/3] Đang tải thư viện (cần internet)..."
npm install --no-fund --no-audit

echo "[3/3] Xong! Đường dẫn hook Claude Code trên máy này:"
echo "      $(pwd)/hooks/claude-code-hook.js"
echo
bash ./chay.sh
