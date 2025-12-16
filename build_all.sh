#!/bin/bash

# 全平台打包脚本（在对应平台上运行）

echo "======================================"
echo "云创 AI 漫剧 - 全平台打包脚本"
echo "======================================"

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "检测到 macOS 系统，开始 Mac 打包..."
    bash build_mac.sh
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "检测到 Windows 系统，开始 Windows 打包..."
    cmd //c build_windows.bat
else
    echo "不支持的操作系统: $OSTYPE"
    exit 1
fi

echo ""
echo "======================================"
echo "打包完成！"
echo "======================================"
