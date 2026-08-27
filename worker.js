export default {
  async fetch(request, env) {
    const API_KEY = env.API_KEY;
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization");

    // 🔐 API key check
    if (auth !== `Bearer ${API_KEY}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    // 🚫 Only allow POST requests to /
    if (request.method !== "POST" || url.pathname !== "/") {
      return json({ error: "Not allowed" }, 405);
    }

    try {
    // Choose model from the following list:
        // "@cf/blackforestlabs/ux-1-schnell"
        // "@cf/bytedance/stable-diffusion-xl-lightning"
        // "@cf/lykon/dreamshaper-8-lcm"
        // "@cf/runwayml/stable-diffusion-v1-5-img2img"
        // "@cf/runwayml/stable-diffusion-v1-5-inpainting"
        // "@cf/stabilityai/stable-diffusion-xl-base-1.0"
      const { model="@cf/stabilityai/stable-diffusion-xl-base-1.0", prompt, ...rest } = await request.json();

      // It's best to keep this and remove the defult
      // if (!model) {
      //   return json(
      //     { error: "Model is required. Find more on https://developers.cloudflare.com/workers-ai/models/" },
      //     400
      //   );
      // }
      if (!prompt) {
        return json({ error: "Prompt is required" }, 400);
      }

      // Execute model via Cloudflare Workers AI binding
      const response = await env.AI.run(model, {
        prompt,
        ...rest,
      });

      // 1. Handle base64 image responses (e.g., Flux models: { image: "..." })
      if (response?.image && typeof response.image === "string") {
        const binaryString = atob(response.image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new Response(bytes, {
          headers: { "Content-Type": "image/jpeg" },
        });
      }

      // 2. Handle raw binary stream / buffer image responses
      if (
        response instanceof ReadableStream ||
        response instanceof ArrayBuffer ||
        response instanceof Uint8Array
      ) {
        return new Response(response, {
          headers: { "Content-Type": "image/jpeg" },
        });
      }

      // 3. Handle standard text/LLM/JSON responses
      return json(response, 200);
    } catch (err) {
      return json(
        {
          error: "Failed to process request",
          details: err.message,
        },
        500
      );
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
