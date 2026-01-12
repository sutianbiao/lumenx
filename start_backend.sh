#!/bin/bash

echo "========================================"
echo "Starting Backend (FastAPI)..."
echo "Port: 17177"
echo "========================================"

# 确保在项目根目录
cd "$(dirname "$0")"

# 启动 uvicorn
python -m uvicorn src.apps.comic_gen.api:app --reload --port 17177 --host 0.0.0.0

