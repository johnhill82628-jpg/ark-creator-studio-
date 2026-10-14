
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

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // API connection test
    if (path === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        app: "ARK CREATOR STUDIO",
        message: "API connected"
      });
    }

    // Generate AI script
    if (path === "/api/generate" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!String(body.topic || "").trim()) {
          return json({
            ok: false,
            error: "ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပေးပါ။"
          }, 400);
        }

        const script = await generateScript(body);

        return json({
          ok: true,
          script
        });
      } catch (error) {
        console.error("Generation failed:", error);

        return json({
          ok: false,
          error: error.message || "AI Script ထုတ်မရပါ။"
        }, 502);
      }
    }

    // Serve website files
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({
      ok: false,
      error: "Website assets binding မတွေ့ပါ။"
    }, 404);
  }
};
