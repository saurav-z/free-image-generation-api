# ✨ Free AI Image Generation API (100,000 Calls/Day) ⚡

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/saurav-z/free-image-generation-api?style=social)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)
![AI](https://img.shields.io/badge/AI-Stable%20Diffusion-purple.svg)

**🚀 Deploy your own free AI image generation API in minutes!**

</div>

This project lets you deploy your own **free AI image generation API** using Cloudflare Workers, with up to **100,000 API calls per day**. Generate stunning images from text prompts using powerful models like Stable Diffusion XL! 🎨

## ✨ Features
- 🆓 **100,000 free API calls per day** (Cloudflare Workers AI free tier)
- ⚡ **Lightning-fast** image generation from text prompts
- 🛠️ **Easy to deploy** - no coding experience required
- 🔒 **Secure** with API key authentication
- 🎯 **Multiple AI models** available

---

## 🚀 How It Works
- 📤 You deploy a Cloudflare Worker using the provided `worker.js` file
- 🌐 The Worker exposes a simple API endpoint for image generation
- 🔐 You authenticate using your own API key
- 🤖 The Worker uses Cloudflare's free AI models to generate images

---

## 📋 Setup Instructions

### 1. 🌟 Get a Cloudflare Account
- Sign up at [Cloudflare](https://dash.cloudflare.com/sign-up) if you don't have one

### 2. ⚡ Create a New Worker
- Go to the [Cloudflare Workers dashboard](https://dash.cloudflare.com/workers)
- Click **"Create application"** 🎯
- Choose **"Create Worker"** 
- Give it a name like `free-image-generation-api` 📝
- Click **"Deploy"** to create a Hello World worker 🚀

### 3. 🔧 Replace the Worker Code
- In the worker editor, replace the default Hello World code with the `worker.js` code from this repo 📄
- Click **"Save and Deploy"** ✅

### 4. 🔑 Set Up Environment Variables
- In your worker dashboard, go to **"Settings"** > **"Variables"** ⚙️
- Under **"Environment Variables"**, click **"Add variable"** ➕
- Name: `API_KEY` 🏷️
- Value: `your-secret-api-key` (replace with a strong secret key) 🔒
- Click **"Save and Deploy"** 💾

### 5. 🤖 Enable Workers AI
- In the Cloudflare dashboard, go to **"Workers & Pages"** > **"AI"** 🧠
- Enable Workers AI for your account (free tier is enough) 🆓

### 6. 🔗 Add AI Binding to Your Worker
- Go back to your worker's dashboard
- Click on **"Settings"** > **"Variables"** ⚙️
- Scroll down to **"Service bindings"** section
- Click **"Add binding"** ➕
- Variable name: `AI` 🏷️
- Service: Select **"Workers AI"** from dropdown 🤖
- Click **"Save and Deploy"** ✅

> ⚠️ **Important:** Without this AI binding, your worker won't be able to access Cloudflare's AI models!

### 7. 🌐 Get Your Worker URL
- Your worker will be available at: `https://<your-worker-name>.<your-subdomain>.workers.dev` 🔗
- You can find the exact URL in your worker's dashboard 📍

---

## 🎯 Usage

### 🖥️ cURL Example
```bash
curl -X POST https://<your-worker-name>.<your-subdomain>.workers.dev \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cute robot cooking breakfast"}' \
  --output image.png
```

### 🌐 JavaScript Example
```js
const res = await fetch("https://<your-worker-name>.<your-subdomain>.workers.dev", {
  method: "POST",
  headers: {
    "Authorization": "Bearer your-secret-api-key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: "A futuristic city in the clouds" }),
});
const blob = await res.blob();
const img = document.createElement("img");
img.src = URL.createObjectURL(blob);
img.style.height = "500px";
document.body.appendChild(img);
```

---

## ⚙️ Optional Request Parameters
Besides `prompt`, the API accepts these optional fields (validated by the Worker):

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `negative_prompt` | string | up to 2048 chars | Things to avoid in the image |
| `width` | integer | 256–2048 | Image width in pixels |
| `height` | integer | 256–2048 | Image height in pixels |
| `num_steps` | integer | 1–20 | Denoising steps (higher = slower) |
| `seed` | integer | ≥ 0 | Fixed seed for repeatable results |

```json
{ "prompt": "A red fox in snow", "negative_prompt": "blurry", "num_steps": 12, "seed": 42 }
```

---

## 📝 Notes
- 🆓 **Free Tier:** Cloudflare Workers AI free tier allows 100,000 AI requests per day. See [Cloudflare pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) for details.
- 🎨 **Models:** You can change the `MODEL` value in `worker.js` to use other available models (see comments in the file). The response is a PNG image.
- 💰 **Caching:** Identical requests are cached for 1 day using the Cloudflare Cache API. Repeat prompts return instantly and do **not** use your daily AI quota.
- 🌐 **CORS:** The Worker sends CORS headers and handles preflight requests, so it works from a browser (like `frontend_demo.html`).
- ✅ **Validation:** The Worker checks the API key, the request method, and every input before calling the AI model.
- 🔒 **Security:** Keep your API key secret and rotate it if needed. The Worker refuses to run (`500 Server not configured`) if `API_KEY` is not set, so it never accepts requests without a real key.
- 🚦 **Rate limiting (recommended):** A single shared key has no per-user limit. For public use, add [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/) or a KV/Durable Object counter to protect your quota from abuse.

---

## 📄 License
MIT License ⭐

---

<div align="center">

**⭐ Star this repo if it helped you! ⭐**

</div>
