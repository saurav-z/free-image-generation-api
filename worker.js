export default {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        // 🟢 1. Handle Browser CORS Preflight (OPTIONS) Request
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        const url = new URL(request.url);

        // 🟢 2. Health Check (GET Request)
        if (request.method === "GET" && url.pathname === "/") {
            return json({ status: "active", message: "Cloudflare AI Image API is running" }, 200, corsHeaders);
        }

        // 🔐 3. API Key Authentication
        const API_KEY = env.CF_API_KEY;
        const auth = request.headers.get("Authorization");

        if (auth !== `Bearer ${API_KEY}`) {
            return json({ error: "Unauthorized" }, 401, corsHeaders);
        }

        // 🚫 4. Only Allow POST Requests to Root Path
        if (request.method !== "POST" || url.pathname !== "/") {
            return json({ error: "Method not allowed" }, 405, corsHeaders);
        }

        try {
            const body = await request.json();
            const prompt = body.prompt;

            // Supported model list:
            // "@cf/blackforestlabs/flux-1-schnell"
            // "@cf/bytedance/stable-diffusion-xl-lightning"
            // "@cf/lykon/dreamshaper-8-lcm"
            // "@cf/runwayml/stable-diffusion-v1-5-img2img"
            // "@cf/runwayml/stable-diffusion-v1-5-inpainting"
            // "@cf/stabilityai/stable-diffusion-xl-base-1.0"
            const model = body.model || "@cf/stabilityai/stable-diffusion-xl-base-1.0";

            if (!prompt) {
                return json({ error: "Prompt is required" }, 400, corsHeaders);
            }

            // 🧠 AI Image Generation
            const result = await env.AI.run(model, { prompt });

            // 🖼️ Return Generated Binary JPEG with CORS Headers
            return new Response(result, {
                headers: {
                    "Content-Type": "image/jpeg",
                    ...corsHeaders,
                },
            });
        } catch (err) {
            return json({ error: "Failed to generate image", details: err.message }, 500, corsHeaders);
        }
    },
};

// 📦 Helper Function to Return JSON Responses with CORS Support
function json(data, status = 200, corsHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
        },
    });
}
