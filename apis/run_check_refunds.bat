@echo off
cd /d D:\QUÝ\DOAN\apis
call .venv\Scripts\activate
python manage.py check_refund_pending >> logs\payout_check.log 2>&1
pause