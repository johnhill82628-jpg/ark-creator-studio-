
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export async function generateScript(env, input) {
  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY_MISSING");
  }

  const topic = String(input.topic || "").trim();

  if (!topic) {
    throw new Error("TOPIC_REQUIRED");
  }

  const response = await fetch(GROQ_API_URL, {
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
          content:
            "You are a professional Myanmar AI video script writer. Generate original, engaging scripts in the requested language. For videos, include scenes, timestamps, visual descriptions, dialogue, narration and sound effects when appropriate.",
        },
        {
          role: "user",
          content: [
            `Topic: ${topic}`,
            `Content type: ${input.contentType || "AI Video"}`,
            `Duration: ${input.duration || "60 seconds"}`,
            `Language: ${input.language || "Myanmar"}`,
            `Visual style: ${input.style || "Cinematic"}`,
            "Create a complete, clearly structured script.",
          ].join("\n"),
        },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Groq API error:", data);
    throw new Error(
      data?.error?.message || "GROQ_REQUEST_FAILED"
    );
  }

  const script = data?.choices?.[0]?.message?.content;

  if (!script) {
    throw new Error("EMPTY_AI_RESPONSE");
  }

  return script.trim();
}
