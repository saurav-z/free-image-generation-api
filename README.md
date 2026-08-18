# ✨ Free AI Image Generation API (Cloudflare Workers) ⚡

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)
![AI](https://img.shields.io/badge/AI-Workers%20AI-purple.svg)
![CORS](https://img.shields.io/badge/CORS-Enabled-green.svg)

**🚀 Deploy your own free AI image generation API in minutes!**

</div>

This project allows you to deploy your own **free, high-performance AI image generation API** using Cloudflare Workers, supporting up to **10,000+ AI requests per day** on Cloudflare's free tier. Generate high-resolution images from text prompts using models like **Stable Diffusion XL**, **FLUX.1 Schnell**, and **SDXL Lightning**! 🎨

---

## ✨ Key Features
- 🆓 **Free Tier Friendly:** Uses Cloudflare Workers AI with generous daily limits.
- ⚡ **Lightning-Fast:** Generates images in seconds directly on Cloudflare edge.
- 🌐 **Full CORS Support:** Ready for direct browser integration (`fetch`) with automatic `OPTIONS` preflight handling.
- 🩺 **Built-in Health Check:** `GET /` endpoint to monitor API uptime.
- 🎯 **Dynamic Model Selection:** Switch AI models on-the-fly via the request payload.
- 🎨 **Modern Web UI Included:** Includes `frontend_demo.html` — a dark-mode studio interface.
- 🔒 **Secure:** Bearer token (`CF_API_KEY`) authentication.

---

## 🚀 How It Works
1. Deploy the provided [`worker.js`](worker.js) script to Cloudflare Workers.
2. Bind **Workers AI** to your worker.
3. Set your secret `CF_API_KEY` in worker environment variables.
4. Send `POST` requests from cURL, Python, PHP, or open [`frontend_demo.html`](frontend_demo.html) directly in any browser!

---

## 📋 Setup Instructions

### 1. 🌟 Get a Cloudflare Account
- Sign up at [Cloudflare](https://dash.cloudflare.com/sign-up) if you don't have an account.

### 2. ⚡ Create a New Worker
- Go to the [Cloudflare Workers Dashboard](https://dash.cloudflare.com/workers).
- Click **"Create application"** ➡️ **"Create Worker"**.
- Choose a name (e.g., `image-api`) and click **"Deploy"**.

### 3. 🔧 Paste the Worker Code
- In the Worker editor, click **"Edit code"** and replace all contents with the code from [`worker.js`](worker.js).
- Click **"Save and Deploy"** ✅.

### 4. 🔑 Set Up the API Key
- In your Worker dashboard, go to **"Settings"** ➡️ **"Variables and Secrets"** ⚙️.
- Under **"Environment Variables"**, click **"Add variable"** ➕:
  - **Variable name:** `CF_API_KEY`
  - **Value:** `your-secret-api-key` (choose a strong secret key)
- Click **"Save and Deploy"** 💾.

### 5. 🤖 Bind Workers AI
- In your Worker dashboard, go to **"Settings"** ➡️ **"Bindings"** (or **Variables**).
- Under **"Service bindings"** / **"Workers AI"**, click **"Add binding"** ➕:
  - **Type:** `Workers AI`
  - **Binding name:** `AI`
- Click **"Save and Deploy"** ✅.

> ⚠️ **Important:** Without the `AI` binding named `AI`, Cloudflare cannot run AI models.

### 6. 🌐 Get Your Worker URL
- Your worker endpoint will be: `https://<your-worker-name>.<your-subdomain>.workers.dev`

---

## 🎯 API Usage

### 1. Health Check (`GET /`)
```bash
curl -X GET https://<your-worker-url>
```
**Response:**
```json
{
  "status": "active",
  "message": "Cloudflare AI Image API is running"
}
```

### 2. Generate Image (`POST /`)
```bash
curl -X POST https://<your-worker-url> \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic cyberpunk city at night, neon reflections on wet asphalt, cinematic lighting, 8k resolution",
    "model": "@cf/stabilityai/stable-diffusion-xl-base-1.0"
  }' \
  --output generated_image.jpg
```

---

## 🎨 Supported AI Models
You can pass any of the following models in the `"model"` field:
- `@cf/stabilityai/stable-diffusion-xl-base-1.0` *(Default - High quality)*
- `@cf/blackforestlabs/flux-1-schnell` *(State-of-the-art fast rendering)*
- `@cf/bytedance/stable-diffusion-xl-lightning` *(Ultra-fast generation)*
- `@cf/lykon/dreamshaper-8-lcm` *(Artistic / stylized)*
- `@cf/runwayml/stable-diffusion-v1-5-img2img`

---

## 🖥️ Web Interface Demo
Simply double-click [`frontend_demo.html`](frontend_demo.html) in your browser:
- Enter your **API URL** and **API Key**.
- Type your prompt or select from curated style tags.
- Click **"Generate Image"** to create, view fullscreen, and download `.jpg` images!

---

## 📄 License
MIT License © 2026
