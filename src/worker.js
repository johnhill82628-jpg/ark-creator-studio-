import { generateScript } from "./groq.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API HEALTH CHECK
    if (
      url.pathname === "/api/health" &&
      request.method === "GET"
    ) {
      return Response.json({
        ok: true,
        app: "ARK CREATOR STUDIO",
        message: "Worker is running"
      });
    }

    // AI SCRIPT GENERATOR
    if (
      url.pathname === "/api/generate" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        if (!body.topic || !String(body.topic).trim()) {
          return Response.json(
            {
              ok: false,
              error: "ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပေးပါ။"
            },
            { status: 400 }
          );
        }

        const script = await generateScript(env, body);

        return Response.json({
          ok: true,
          script: script
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            error: error.message || "Groq API error"
          },
          { status: 500 }
        );
      }
    }

    // WEBSITE FILES
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return Response.json(
      {
        ok: false,
        error: "Route not found"
      },
      { status: 404 }
    );
  }
};
