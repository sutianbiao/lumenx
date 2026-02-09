<!-- Banner Placeholder -->
<div align="center">
  <img src="docs/images/LumenX Studio Banner.jpeg" alt="LumenX Studio Banner" width="100%" />
</div>

<div align="center">

# LumenX Studio

### AI-Native Motion Comic Creation Platform
**Render Noise into Narrative**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![Node](https://img.shields.io/badge/node-18%2B-green)](https://nodejs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/alibaba/lumenx?style=social)](https://github.com/alibaba/lumenx)

[English](README_EN.md) | [中文](README.md) | [User Manual](USER_MANUAL.md) | [Contributing](CONTRIBUTING.md)

</div>

---

LumenX Studio is an **all-in-one AI motion comic production platform**. It automatically transforms novel text into dynamic videos, streamlining the entire workflow from script analysis and character customization to storyboard composition and video synthesis.

LumenX Studio naturally integrates the full-link SOP of **Asset Extraction -> Style Definition -> Asset Generation -> Storyboard Construction -> Storyboard Generation -> Video Generation**. It incorporates industry know-how on top of comprehensive features, allowing creators to quickly produce high-quality AI short films with greatly improved efficiency.

The platform natively integrates Alibaba's Qwen & Wanx series model capabilities, dedicated to providing an intelligent, convenient, and flexible flexible creation experience, enabling creators to complete motion comic production in one stop without frequent switching between web pages or apps.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📝 **Deep Script Analysis** | LLM-based extraction of characters, scenes, and props to generate professional shooting scripts |
| 🎨 **Art Direction Control** | Custom visual style support (LoRA/Style Transfer) ensuring consistent art direction |
| 🎬 **Visual Storyboard** | Drag-and-drop storyboard editor for WYSIWYG composition of characters and backgrounds |
| 🎥 **Multimodal Generation** | Integration with Wanx and other models for Text-to-Image and Image-to-Video generation |
| 🎵 **Smart AV Synthesis** | Automated character dubbing (TTS), sound effects (SFX), and final video synthesis |

---

## 📸 Demo

<div align="center">
  <!-- Demo GIF Placeholder -->
  <img src="docs/images/demo.gif" alt="LumenX Studio Demo" width="100%" />
</div>

---

## 🏗️ Architecture

LumenX Studio utilizes a modern separated frontend/backend architecture for scalability and performance.

<div align="center">
  <!-- Architecture Diagram -->
  <img src="docs/images/architecture.svg" alt="System Architecture" width="80%" />
</div>

**Tech Stack:**
- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python 3.11+
- **AI Core**: Alibaba Cloud Qwen (Logic) + Wanx (Visuals)
- **Render**: Three.js (Canvas) + FFmpeg (Video Processing)

---

## 🚀 Quick Start

### 1. Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+
- **FFmpeg**: Required (for video processing)

### 2. Clone Repository

```bash
git clone https://github.com/alibaba/lumenx.git
cd lumenx
```

### 3. Configure API Keys

Copy the configuration template and fill in your API Key (Alibaba Cloud Model Studio / Bailian service required):

```bash
cp .env.example .env
# Edit .env and fill in DASHSCOPE_API_KEY
```

### 4. Start Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Create output directories
mkdir -p output/uploads

# Start service (http://localhost:8000)
./start_backend.sh
```

### 5. Start Frontend

```bash
cd frontend

# Install dependencies & start service (http://localhost:3000)
npm install && npm run dev
```

---

## 📖 Documentation

- **[User Manual](USER_MANUAL.md)**: **Must-read** for first-time users.
- **[API Documentation](http://localhost:8000/docs)**: Backend Swagger UI.

---

## ⚙️ Advanced Configuration

<details>
<summary>Click to expand configuration details</summary>

### OSS Object Storage (Recommended)
For security and performance, it is recommended to configure Alibaba Cloud OSS for storing generated media:

1. Create a **Private** Bucket
2. Configure in `.env` or App Settings:
   ```env
   ALIBABA_CLOUD_ACCESS_KEY_ID=...
   ALIBABA_CLOUD_ACCESS_KEY_SECRET=...
   # Configure Bucket Name and Endpoint within the app
   ```

### Config File Locations
- **Development**: `.env` in project root
- **Packaged App**: `~/.lumen-x/config.json` in user home directory

</details>

---

## 📁 Directory Structure

```
lumenx/
├── frontend/          # Next.js Frontend
├── src/               # Python Backend Core
│   ├── apps/         # Business Logic
│   ├── models/       # AI Model Interfaces
│   └── utils/        # Utilities
├── output/            # (Auto-generated) Output Directory
```

---

## 🤝 Contributing

We welcome community contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for code standards and submission process.

- **Bug Reports**: Submit via [GitHub Issues](https://github.com/alibaba/lumenx/issues)
- **Feature Requests**: Discuss in [Discussions](https://github.com/alibaba/lumenx/discussions)

## 👤 Author

**StarLotus (星莲)** - *Lead Developer & Maintainer*

For any feedback or questions, please reach out via [GitHub Issues](https://github.com/alibaba/lumenx/issues) or [Discussions](https://github.com/alibaba/lumenx/discussions).
- **Email**: [zhangjunhe.zjh@alibaba-inc.com](mailto:zhangjunhe.zjh@alibaba-inc.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ by Alibaba Group
</div>
