#!/usr/bin/env bash
# MỞ VĂN PHÒNG AGENT (macOS / Linux). Chạy: bash chay.sh — nhấn Ctrl+C để tắt.
cd "$(dirname "$0")"
[ -d node_modules ] || { bash ./cai-dat.sh; exit; }
if curl -s -o /dev/null -m 2 http://localhost:5173/api/info; then
  echo "Văn phòng đang chạy sẵn: http://localhost:5173"
  (command -v open >/dev/null && open http://localhost:5173) || xdg-open http://localhost:5173 2>/dev/null
  exit 0
fi
echo "Văn phòng Agent: http://localhost:5173  (Ctrl+C để tắt)"
npm run dev -- --open
