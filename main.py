import os
import sys
import threading
import time

from starlette.staticfiles import StaticFiles
from PyQt5.QtWidgets import QApplication
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl

cwd = os.getcwd()
path = os.path.expanduser("~/.tron/comic")
os.makedirs(path, exist_ok=True)
os.chdir(path)

import uvicorn
from src.apps.comic_gen.api import app

def run_server():
    app.mount("/static", StaticFiles(directory=
                                    os.path.join(cwd, "static"), html=True), name="static")
    
    uvicorn.run("src.apps.comic_gen.api:app",
                host="127.0.0.1",
                port=8000,
                reload=False,
                loop="uvloop",
                http="httptools",
                log_level="info",
                )

def open_webview():
    # 等待服务器启动
    time.sleep(2)
    
    qt_app = QApplication(sys.argv)
    
    browser = QWebEngineView()
    browser.setWindowTitle("云创 AI 漫剧")
    browser.resize(1280, 800)
    browser.load(QUrl("http://127.0.0.1:8000/static/index.html"))
    browser.show()
    
    exit_code = qt_app.exec_()
    
    # WebView 关闭后，退出整个进程
    os._exit(exit_code)

if __name__ == "__main__":
    # 在后台线程启动服务器
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # 在主线程打开 WebView
    open_webview()
