
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        ok: true,
        app: "ARK CREATOR STUDIO",
        message: "Backend is running!"
      });
    }

    return new Response(
      "ARK CREATOR STUDIO API is ready.",
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
};
