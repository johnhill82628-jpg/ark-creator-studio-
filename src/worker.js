
import { generateScript } from "./groq.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // API health check
    if (path === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        app: "ARK CREATOR STUDIO",
        message: "Worker is running",
        keyConfigured: Boolean(env.GROQ_API_KEY)
      });
    }

    // Generate AI script
    if (path === "/api/generate" && request.method === "POST") {
      try {
        if (!env.GROQ_API_KEY) {
          return json({
            ok: false,
            error: "Cloudflare Secret GROQ_API_KEY မရရှိပါ။"
          }, 500);
        }

        let body;

        try {
          body = await request.json();
        } catch {
          return json({
            ok: false,
            error: "Request JSON မမှန်ပါ။"
          }, 400);
        }

        if (!String(body.topic || "").trim()) {
          return json({
            ok: false,
            error: "ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပေးပါ။"
          }, 400);
        }

        // Pass Cloudflare environment to groq.js
        const script = await generateScript(env, body);

        return json({
          ok: true,
          script
        });
      } catch (error) {
        console.error("Groq generation error:", error);

        return json({
          ok: false,
          error: error.message || "AI Script ထုတ်မရပါ။"
        }, 502);
      }
    }

    // Serve website assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({
      ok: false,
      error: "Route not found"
    }, 404);
  }
};
