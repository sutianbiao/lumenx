# AI 短漫剧制作平台

一个基于 AI 的短漫剧/漫画视频制作平台，支持从剧本到成片的完整工作流。

## 技术栈

**前端**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Three.js  
**后端**: FastAPI + Python 3.11+  
**AI 服务**: 阿里云通义千问(Qwen) + 万相(Wanx)

## 快速开始

### 1. 环境准备

复制 `.env.example` 为 `.env` 并填入你的 API Keys：

```bash
cp .env.example .env
# 编辑 .env 文件，填入真实的 API Keys
```

### 2. 后端启动

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 创建输出目录
mkdir -p output/uploads

# 启动 FastAPI 服务
python -m uvicorn src.apps.comic_gen.api:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 http://localhost:8000 启动  
API 文档: http://localhost:8000/docs

### 3. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:3000 启动

## 项目结构

```
├── frontend/              # Next.js 前端应用
│   ├── src/
│   │   ├── app/          # App Router 页面
│   │   ├── components/   # React 组件
│   │   ├── lib/          # 工具库
│   │   └── store/        # 状态管理
│   └── package.json
├── src/                   # Python 后端代码
│   ├── apps/comic_gen/   # 核心应用
│   ├── models/           # AI 模型封装
│   ├── utils/            # 工具函数
│   └── config.py
├── demand/                # 文档
│   ├── 平台核心代码说明.md
│   └── AI漫剧制作全流程SOP.md
├── requirements.txt       # Python 依赖
└── .env.example          # 环境变量模板
```

## 核心功能

1. **剧本分析**: 输入小说/剧本，AI 自动提取角色、场景、道具和分镜
2. **美术指导**: AI 推荐视觉风格，支持自定义风格参数
3. **素材生成**: 为角色、场景、道具生成 AI 图片
4. **分镜编辑**: 可视化画布，拖拽素材组合分镜
5. **视频生成**: 基于分镜图生成动态视频
6. **音频混音**: 角色配音 + 环境音效 + 背景音乐
7. **成片导出**: 合并视频和音频，导出最终作品

## 详细文档

- [平台核心代码说明](demand/平台核心代码说明.md)
- [云创 AI 漫剧制作全流程 SOP](demand/AI漫剧制作全流程SOP.md)

## API 文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的 API 文档。

## 常见问题

**Q: 如何获取阿里云 API Keys？**  
A: 访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/) 创建 API Key

**Q: 前端无法连接后端？**  
A: 检查后端是否在 8000 端口运行，以及 CORS 配置是否正确

**Q: 如何部署到生产环境？**  
A: 前端使用 `npm run build` 构建静态文件，后端使用 Docker + Gunicorn 部署

## 许可证

[根据项目实际情况填写]

## 联系方式

[根据项目实际情况填写]
