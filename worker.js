// CORS headers shared by every response so a browser can call this Worker
// from a different origin (the demo page, another site, etc.).
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
};

// Model used for text-to-image generation. Callers may override this with
// the optional "model" request field, but only from this allowlist — never
// pass an arbitrary model string to env.AI.run.
const DEFAULT_MODEL = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
const ALLOWED_MODELS = new Set([
    "@cf/black-forest-labs/flux-1-schnell",
    "@cf/bytedance/stable-diffusion-xl-lightning",
    "@cf/lykon/dreamshaper-8-lcm",
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
]);

// Limits to protect against abuse and wasted compute.
const MAX_PROMPT_LENGTH = 2048;
const CACHE_TTL_SECONDS = 86400; // Cache identical results for 1 day.

export default {
    async fetch(request, env, ctx) {
        // Answer CORS preflight first. Preflight (OPTIONS) requests do not
        // carry the Authorization header, so auth must not run for them.
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        // Fail closed: refuse to run if no API key is configured. Otherwise a
        // missing API_KEY would make the check compare against "Bearer undefined".
        const API_KEY = env.API_KEY;
        if (!API_KEY) {
            return json({ error: "Server not configured" }, 500);
        }

        // 🔐 API key check (constant-time to avoid timing side-channels).
        const auth = request.headers.get("Authorization") || "";
        if (!safeEqual(auth, `Bearer ${API_KEY}`)) {
            return json({ error: "Unauthorized" }, 401);
        }

        // 🚫 Only allow POST requests to /.
        const url = new URL(request.url);
        if (request.method !== "POST" || url.pathname !== "/") {
            return json({ error: "Not allowed" }, 405);
        }

        try {
            // Parse and validate the request body.
            let body;
            try {
                body = await request.json();
            } catch {
                return json({ error: "Invalid JSON body" }, 400);
            }

            const { prompt } = body;
            if (typeof prompt !== "string" || prompt.trim() === "") {
                return json({ error: "Prompt is required and must be a string" }, 400);
            }
            if (prompt.length > MAX_PROMPT_LENGTH) {
                return json({ error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)` }, 400);
            }

            // Collect optional, validated generation settings.
            const options = buildOptions(body);
            if (options.error) return json({ error: options.error }, 400);
            const inputs = { prompt: prompt.trim(), ...options.value };

            // Optional model override, restricted to the allowlist.
            let model = DEFAULT_MODEL;
            if (body.model !== undefined) {
                if (typeof body.model !== "string" || !ALLOWED_MODELS.has(body.model)) {
                    return json(
                        { error: `model must be one of: ${[...ALLOWED_MODELS].join(", ")}` },
                        400
                    );
                }
                model = body.model;
            }

            // 💰 Cache identical requests to save AI compute and cost.
            const cache = caches.default;
            const cacheKey = await buildCacheKey(model, inputs);
            const cached = await cache.match(cacheKey);
            if (cached) return withCors(cached);

            // 🧠 Generate the image from the prompt.
            const result = await env.AI.run(model, inputs);

            // Most models return a binary image stream, but flux-1-schnell
            // returns { image: "<base64>" } (as a JPEG) instead.
            let imageBody = result;
            let contentType = "image/png";
            if (result && typeof result === "object" && typeof result.image === "string") {
                const binary = atob(result.image);
                imageBody = Uint8Array.from(binary, (c) => c.codePointAt(0));
                contentType = "image/jpeg";
            }

            const response = new Response(imageBody, {
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": contentType,
                    "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
                },
            });

            // Store in cache without delaying the response to the client.
            ctx.waitUntil(cache.put(cacheKey, response.clone()));

            return response;
        } catch (err) {
            // Log full detail server-side; return a generic message to the client.
            console.error("Image generation failed:", err);
            return json({ error: "Failed to generate image" }, 500);
        }
    },
};

// ✅ Validate and collect optional generation options.
function buildOptions(body) {
    const value = {};

    if (body.negative_prompt !== undefined) {
        if (typeof body.negative_prompt !== "string" || body.negative_prompt.length > MAX_PROMPT_LENGTH) {
            return { error: "negative_prompt must be a string within the length limit" };
        }
        value.negative_prompt = body.negative_prompt;
    }

    for (const key of ["width", "height"]) {
        if (body[key] !== undefined) {
            const n = Number(body[key]);
            if (!Number.isInteger(n) || n < 256 || n > 2048) {
                return { error: `${key} must be an integer between 256 and 2048` };
            }
            value[key] = n;
        }
    }

    if (body.num_steps !== undefined) {
        const n = Number(body.num_steps);
        if (!Number.isInteger(n) || n < 1 || n > 20) {
            return { error: "num_steps must be an integer between 1 and 20" };
        }
        value.num_steps = n;
    }

    if (body.seed !== undefined) {
        const n = Number(body.seed);
        if (!Number.isInteger(n) || n < 0) {
            return { error: "seed must be a non-negative integer" };
        }
        value.seed = n;
    }

    return { value };
}

// 🔑 Build a stable GET-based cache key from the request inputs.
async function buildCacheKey(model, inputs) {
    const data = JSON.stringify({ model, inputs });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return new Request(`https://image-cache.internal/${hash}`, { method: "GET" });
}

// Add CORS headers to a (possibly cached) response.
function withCors(response) {
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
    return new Response(response.body, { status: response.status, headers });
}

// 🛡️ Constant-time string comparison to avoid timing side-channels.
function safeEqual(a, b) {
    const enc = new TextEncoder();
    const aBytes = enc.encode(a);
    const bBytes = enc.encode(b);
    if (aBytes.length !== bBytes.length) return false;
    let diff = 0;
    for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
    return diff === 0;
}

// 📦 Return a JSON response (always with CORS headers).
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
}
