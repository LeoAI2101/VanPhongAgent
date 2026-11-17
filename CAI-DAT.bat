@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Cai dat Van phong Agent

echo.
echo  ============================================
echo     CÀI ĐẶT VĂN PHÒNG AGENT 3D
echo  ============================================
echo.

rem ---------- 1. Kiểm tra Node.js ----------
where node >nul 2>nul
if not errorlevel 1 goto check_version

echo  [1/4] Máy chưa có Node.js (cần để chạy văn phòng).
where winget >nul 2>nul
if errorlevel 1 goto manual_node

choice /C YN /M "        Cài Node.js LTS tự động bằng winget"
if errorlevel 2 goto manual_node

winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
rem winget cài xong nhưng cửa sổ này chưa biết đường dẫn mới → tự thêm vào
set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Đã cài Node.js. Hãy ĐÓNG cửa sổ này rồi bấm đúp CAI-DAT.bat một lần nữa.
  pause
  exit /b 0
)

:check_version
node -e "process.exit(+process.versions.node.split('.')[0] >= 18 ? 0 : 1)"
if errorlevel 1 (
  echo  [1/4] Node.js quá cũ. Cần bản 18 trở lên. Hãy cài bản mới ở https://nodejs.org
  start "" https://nodejs.org/
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo  [1/4] Node.js %%v  - OK

rem ---------- 2. Tải thư viện ----------
echo  [2/4] Đang tải thư viện (cần internet, khoảng 1-3 phút)...
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo.
  echo  LỖI: Không tải được thư viện. Kiểm tra internet rồi chạy lại CAI-DAT.bat.
  pause
  exit /b 1
)
echo        OK

rem ---------- 3. Biểu tượng trên Desktop ----------
echo  [3/4] Tạo biểu tượng "Van phong Agent" trên Desktop...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d 'Van phong Agent.lnk')); $s.TargetPath=(Join-Path '%~dp0' 'CHAY.bat'); $s.WorkingDirectory='%~dp0'; $s.IconLocation='%SystemRoot%\System32\imageres.dll,186'; $s.Save()" >nul 2>nul
if errorlevel 1 (echo        Không tạo được, bạn có thể mở bằng CHAY.bat) else (echo        OK)

rem ---------- 4. Xong ----------
echo  [4/4] Cài đặt xong!
echo.
echo  LƯU Ý nếu dùng Claude Code: đường dẫn hook trên máy này là
echo     %~dp0hooks\claude-code-hook.js
echo  Mở Phòng thay đồ ^> Nối agent ^> Chép lại đoạn cấu hình mới.
echo.
echo  Đang mở văn phòng...
call "%~dp0CHAY.bat"
