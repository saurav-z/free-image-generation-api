// Corrected Cloudflare Worker for poster hero images.
//
// What changed from the original and why:
//
//   1. width/height are passed. Cloudflare's SDXL-Lightning accepts 256-2048 for both, so a
//      1080x1350 poster hero is possible. The original passed neither, so every image came back
//      1024x1024 square and could not fill a portrait hero slot.
//
//   2. negative_prompt is passed. Without it nothing suppresses lettering, and SDXL draws garbled
//      text readily. A poster hero must be text-free because all real text comes from the layer
//      renderer. "text, letters, words, typography, watermark, logo, signature" is the cheapest
//      single quality improvement available here.
//
//   3. guidance is lowered to 2.5. Lightning is a distilled 4-step model; the default 7.5
//      over-saturates and over-cooks. 4 steps with guidance 2.5 is the setting this model is
//      designed for.
//
//   4. The Content-Type is sniffed from the bytes rather than hardcoded. Cloudflare returns JPEG
//      from this model while the original code labelled it image/png (cloudflare-docs#21022).
//
//   5. An optional seed is passed through so a good result can be reproduced.
//
//   6. The plan route validates its JSON before returning it, rather than trusting the model to
//      have produced parseable output.

const IMAGE_MODEL = "@cf/bytedance/stable-diffusion-xl-lightning";
const PLAN_MODEL = "@cf/zai-org/glm-4.7-flash";

const DEFAULT_NEGATIVE =
  "text, letters, words, typography, caption, watermark, logo, signature, " +
  "blurry, low quality, distorted geometry, extra limbs";

// The poster's own restriction list, applied as a negative prompt by default.
function sniffImageType(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "image/webp";
  return "application/octet-stream";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/") {
      return json({ error: "Not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return json({ error: "Body must be JSON", details: err.message }, 400);
    }

    const { action, prompt } = body || {};
    if (!prompt || typeof prompt !== "string") {
      return json({ error: "Prompt is required" }, 400);
    }

    try {
      // ---------------------------------------------------------------
      // Route A: layout planner (unchanged in purpose)
      // ---------------------------------------------------------------
      if (action === "plan") {
        const systemPrompt = `You are a JSON Poster Layout Planner for a 768x1024 canvas.
Analyse the poster edit request and return ONLY a JSON object, no markdown, no explanation:
{"use_layout_dock":true,"top_header_text":"","main_badge":{"show":true,"headline":"MAX 22 CHARS","subtext":"MAX 36 CHARS","bg_hex":"#CD1834"},"info_pill":{"show":true,"text":"","bg_hex":"#107C41"},"qr_code":{"show":true,"label":"SCAN TO APPLY"},"bullet_points":["","",""],"visual_subject":{"show":true,"style":"photorealistic_person OR 2d_illustration","clean_prompt":"visual only, no text"}}`;

        const llm = await env.AI.run(PLAN_MODEL, {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        });
        const raw = llm.response || llm.result || "{}";
        const match = String(raw).match(/\{[\s\S]*\}/);
        if (!match) {
          return json({ error: "Planner returned no JSON", raw: String(raw).slice(0, 500) }, 502);
        }
        try {
          return json(JSON.parse(match[0]), 200);
        } catch (err) {
          return json({ error: "Planner JSON did not parse", raw: match[0].slice(0, 500) }, 502);
        }
      }

      // ---------------------------------------------------------------
      // Route B: image generation
      // ---------------------------------------------------------------
      // 1080x1350 is the poster's canvas; the hero is drawn smaller, so the default here is a
      // portrait image the renderer can crop rather than a square it must letterbox.
      const width = clamp(body.width, 256, 2048, 1024);
      const height = clamp(body.height, 256, 2048, 1280);
      const steps = clamp(body.num_steps, 1, 20, 4);

      const params = {
        prompt,
        negative_prompt: body.negative_prompt || DEFAULT_NEGATIVE,
        width,
        height,
        num_steps: steps,
        guidance: typeof body.guidance === "number" ? body.guidance : 2.5,
      };
      if (Number.isFinite(Number(body.seed))) params.seed = Math.round(Number(body.seed));

      const result = await env.AI.run(IMAGE_MODEL, params);

      // env.AI.run returns a ReadableStream. Read it once so the type can be sniffed, because
      // this model answers with JPEG and the original code labelled every response image/png.
      const buffer = new Uint8Array(await new Response(result).arrayBuffer());
      return new Response(buffer, {
        headers: {
          "Content-Type": sniffImageType(buffer),
          "Content-Length": String(buffer.byteLength),
          "X-Image-Width": String(width),
          "X-Image-Height": String(height),
        },
      });
    } catch (err) {
      return json({ error: "Worker execution failed", details: err.message }, 500);
    }
  },
};
