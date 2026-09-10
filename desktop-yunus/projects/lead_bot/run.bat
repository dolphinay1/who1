@echo off
title Lead Toplama Botu
color 0A

echo.
echo ===========================================
echo PYTHON GEREKSINIMLERI KONTROL EDILIYOR...
echo ===========================================
pip install -r requirements.txt
python -m playwright install chromium

echo.
echo ===========================================
echo BOT BASLATILIYOR...
echo ===========================================
python main.py

echo.
pause
