
import { generateScript } from "./groq.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check
    if (path === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        app: "ARK CREATOR STUDIO",
        message: "Worker is running",
      });
    }

    // Generate AI script
    if (path === "/api/generate" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!body.topic || !String(body.topic).trim()) {
          return json({
            ok: false,
            error: "ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပေးပါ။",
          }, 400);
        }

        const script = await generateScript(env, body);

        return json({
          ok: true,
          script,
        });
      } catch (error) {
        console.error("Generate error:", error);

        const message = error.message || "";

        if (message === "GROQ_API_KEY_MISSING") {
          return json({
            ok: false,
            error: "GROQ_API_KEY Secret မတွေ့ပါ။ Cloudflare Production Secrets ကို စစ်ပါ။",
          }, 500);
        }

        if (message === "TOPIC_REQUIRED") {
          return json({
            ok: false,
            error: "ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပေးပါ။",
          }, 400);
        }

        return json({
          ok: false,
          error: message || "AI Script ထုတ်မရပါ။ Cloudflare Logs ကို စစ်ပါ။",
        }, 502);
      }
    }

    // Serve website files
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({
      ok: false,
      error: "Website assets binding မသတ်မှတ်ရသေးပါ။",
    }, 404);
  },
};
