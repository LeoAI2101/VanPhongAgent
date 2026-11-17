@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Van phong Agent - dong cua so nay de tat

if not exist "node_modules" (
  echo  Chưa cài đặt. Đang chạy CAI-DAT.bat...
  call "%~dp0CAI-DAT.bat"
  exit /b
)

rem Văn phòng đã chạy sẵn (ở cửa sổ khác) → chỉ cần mở trình duyệt
curl -s -o nul -m 2 http://localhost:5173/api/info
if not errorlevel 1 (
  echo  Văn phòng đang chạy sẵn. Mở trình duyệt...
  start "" http://localhost:5173
  exit /b 0
)

echo.
echo  ============================================
echo     VĂN PHÒNG AGENT đang chạy
echo     http://localhost:5173
echo     ĐÓNG CỬA SỔ NÀY để tắt văn phòng
echo  ============================================
echo.
call npm run dev -- --open
if errorlevel 1 (
  echo.
  echo  LỖI: Không chạy được. Nếu báo "Port 5173 is in use", hãy tắt chương trình đang dùng cổng 5173.
  pause
)
