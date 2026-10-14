
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data, status = 200) {
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

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // API health check
    if (url.pathname === "/api/health" && request.method === "GET") {
      return jsonResponse({
        ok: true,
        app: "ARK CREATOR STUDIO",
        message: "Backend is running!",
      });
    }

    // AI Script Generator
    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        if (!env.GROQ_API_KEY) {
          return jsonResponse({
            ok: false,
            error: "GROQ_API_KEY မသတ်မှတ်ရသေးပါ။ Cloudflare Secrets ထဲမှာ ထည့်ပါ။",
          }, 500);
        }

        let body;

        try {
          body = await request.json();
        } catch {
          return jsonResponse({
            ok: false,
            error: "Request JSON မမှန်ပါ။",
          }, 400);
        }

        const topic = String(body.topic || "").trim();
        const contentType = String(body.contentType || "AI Video");
        const duration = String(body.duration || "60 seconds");
        const language = String(body.language || "Myanmar");
        const style = String(body.style || "Cinematic");

        if (!topic) {
          return jsonResponse({
            ok: false,
            error: "ဇာတ်လမ်းခေါင်းစဉ် သို့မဟုတ် အကြောင်းအရာ ထည့်ပေးပါ။",
          }, 400);
        }

        if (topic.length > 2000) {
          return jsonResponse({
            ok: false,
            error: "အကြောင်းအရာ စာလုံးရေ များနေပါတယ်။ အတိုချုံးပြီး ပြန်ထည့်ပါ။",
          }, 400);
        }

        const systemPrompt = `
You are a professional AI content creator and scriptwriter.
Create useful, engaging, original scripts based on the user's request.
Use the requested language.
For video scripts, organize the result into scenes with timestamps,
visual descriptions, dialogue or narration, and relevant sound effects.
Do not claim that voice or image files have been generated.
Return a clear, well-formatted script.
`;

        const userPrompt = `
Create content using these details:

Topic: ${topic}
Content type: ${contentType}
Duration: ${duration}
Language: ${language}
Visual style: ${style}

Requirements:
- Make the content engaging and original.
- Match the requested duration as closely as practical.
- For video, separate scenes clearly.
- Include visual prompts, dialogue or narration, and sound effects when useful.
- If Myanmar language is requested, write naturally in Burmese.
`;

        const aiResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
                {
                  role: "user",
                  content: userPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 5000,
            }),
          }
        );

        const result = await aiResponse.json();

        if (!aiResponse.ok) {
          console.error("Groq API error:", result);

          return jsonResponse({
            ok: false,
            error:
              result?.error?.message ||
              "Groq API မှ တုံ့ပြန်မှု မရပါ။ API Key နဲ့ quota ကို စစ်ဆေးပါ။",
          }, aiResponse.status);
        }

        const script =
          result?.choices?.[0]?.message?.content?.trim();

        if (!script) {
          return jsonResponse({
            ok: false,
            error: "AI က script မထုတ်ပေးနိုင်ခဲ့ပါ။ ထပ်စမ်းကြည့်ပါ။",
          }, 502);
        }

        return jsonResponse({
          ok: true,
          script,
          model: "llama-3.3-70b-versatile",
        });
      } catch (error) {
        console.error("Worker error:", error);

        return jsonResponse({
          ok: false,
          error: "Server error ဖြစ်နေပါတယ်။ နောက်တစ်ကြိမ် ပြန်စမ်းပါ။",
        }, 500);
      }
    }

    // Serve website files for all other requests
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({
      ok: false,
      error: "Website assets binding မတွေ့ပါ။ wrangler.toml ကို စစ်ပါ။",
    }, 500);
  },
};
