@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Sao luu Van phong Agent

echo.
echo  Tạo file .zip để chép sang máy khác (không kèm node_modules nên rất nhẹ).
echo  Dữ liệu nhân viên/model nằm trong du-lieu\ - được văn phòng tự lưu mỗi khi bạn chỉnh sửa.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$name = 'VanPhongAgent-' + (Get-Date -Format 'yyyy-MM-dd_HHmm') + '.zip';" ^
  "New-Item -ItemType Directory -Force 'ban-sao-luu' | Out-Null;" ^
  "$items = Get-ChildItem -Force | Where-Object { $_.Name -notin @('node_modules','dist','ban-sao-luu','.vite') };" ^
  "Compress-Archive -Path $items.FullName -DestinationPath (Join-Path 'ban-sao-luu' $name) -Force;" ^
  "Write-Host ('  Xong: ban-sao-luu\' + $name)"
if errorlevel 1 (
  echo  LỖI: Không tạo được file zip.
  pause
  exit /b 1
)
echo.
echo  Chép file .zip sang máy mới, giải nén, rồi bấm đúp CAI-DAT.bat.
rem "SAO-LUU.bat /im-lang" = không mở thư mục, không chờ phím (dùng khi chạy tự động)
if /i "%~1"=="/im-lang" exit /b 0
start "" "%~dp0ban-sao-luu"
pause
