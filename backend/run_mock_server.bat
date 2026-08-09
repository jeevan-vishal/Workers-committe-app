@echo off
cd /d "C:\Users\admin\OneDrive\Desktop\worker-committee-app\backend"
"C:\Users\admin\OneDrive\Desktop\worker-committee-app\backend\venv\Scripts\python.exe" -m uvicorn mock_server:app --host 127.0.0.1 --port 8000
