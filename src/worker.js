
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
        },
      });

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Backend health check
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        app: "ARK CREATOR STUDIO",
        message: "Backend is running!",
      });
    }

    // Generate AI script with Groq
    if (url.pathname === "/api/generate" && request.method === "POST") {
      if (!env.GROQ_API_KEY) {
        return json({
          error: "Groq API Key ကို Cloudflare Worker Secrets ထဲ ထည့်ဖို့လိုပါတယ်။",
        }, 503);
      }

      let input;

      try {
        input = await request.json();
      } catch {
        return json({ error: "Request data မှားယွင်းနေပါတယ်။" }, 400);
      }

      const topic = String(input.topic || "").trim();

      if (!topic) {
        return json({ error: "Topic ကို ရေးထည့်ပါ။" }, 400);
      }

      if (topic.length > 2000) {
        return json({ error: "Topic သည် စာလုံး 2000 ထက် မကျော်ရပါ။" }, 400);
      }

      const contentType = String(input.contentType || "Myanmar story").slice(0, 100);
      const duration = String(input.duration || "60 seconds").slice(0, 50);
      const language = String(input.language || "Burmese").slice(0, 100);
      const sceneStyle = String(input.sceneStyle || "Detailed scene-by-scene").slice(0, 100);

      const systemPrompt = `
You are the professional AI writing engine for ARK CREATOR STUDIO.

Create useful, detailed video scripts based on the user's topic.
Respect the requested content type, duration, output language and scene style.
If Burmese is requested, write natural Burmese.
If English video prompts with Burmese dialogue are requested, write video prompts in English and spoken dialogue in Burmese script.
Break longer videos into scenes with scene numbers, visual descriptions, actions, dialogue, and relevant sound effects when appropriate.
Keep characters and visual continuity consistent between scenes.
Do not claim that a video, image, or audio file has already been generated.
Return the script directly without unnecessary introductions.
`;

      const userPrompt = `
Topic: ${topic}
Content type: ${contentType}
Target duration: ${duration}
Output language: ${language}
Scene format: ${sceneStyle}

Create the complete script now.
`;

      try {
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
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 5000,
            }),
          }
        );

        const result = await aiResponse.json();

        if (!aiResponse.ok) {
          console.error("Groq API error:", aiResponse.status, result?.error?.message);

          return json({
            error: aiResponse.status === 429
              ? "AI အသုံးပြုမှု ကန့်သတ်ချက် ပြည့်သွားနိုင်ပါတယ်။ ခဏစောင့်ပြီး ပြန်စမ်းပါ။"
              : "Groq API က အဖြေမပေးနိုင်ပါ။ API Key နဲ့ Model အခြေအနေကို စစ်ပါ။",
          }, aiResponse.status === 429 ? 429 : 502);
        }

        const script = result?.choices?.[0]?.message?.content;

        if (!script) {
          return json({ error: "AI အဖြေမရရှိပါ။ ထပ်စမ်းကြည့်ပါ။" }, 502);
        }

        return json({
          ok: true,
          script,
          model: "llama-3.3-70b-versatile",
        });

      } catch (error) {
        console.error("Worker request failed:", error?.message);

        return json({
          error: "AI Server ကို ဆက်သွယ်မရပါ။ အင်တာနက်နဲ့ API အခြေအနေကို စစ်ပါ။",
        }, 502);
      }
    }

    // Serve the website for all other routes
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("ARK CREATOR STUDIO API is ready.", {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};
