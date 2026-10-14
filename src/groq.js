
const GROQ_API_KEY = "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";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export async function generateScript(input) {
  if (
    !GROQ_API_KEY ||
    GROQ_API_KEY === "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"
  ) {
    throw new Error("Groq API Key မထည့်ရသေးပါ။");
  }

  const topic = String(input.topic || "").trim();

  if (!topic) {
    throw new Error("ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပေးပါ။");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional Myanmar AI video script writer. Write original, engaging scripts in the requested language. Structure the result into scenes with timestamps, visual prompts, narration, dialogue and sound effects as appropriate. Follow the requested duration and style."
        },
        {
          role: "user",
          content: [
            `Topic: ${topic}`,
            `Content type: ${input.contentType || "AI Video"}`,
            `Duration: ${input.duration || "60 seconds"}`,
            `Language: ${input.language || "Myanmar"}`,
            `Style: ${input.style || "Cinematic"}`,
            "Write the complete video script."
          ].join("\n")
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || `Groq API error: ${response.status}`
    );
  }

  const script = data?.choices?.[0]?.message?.content;

  if (!script) {
    throw new Error("AI က Script ပြန်မပေးပါ။");
  }

  return script.trim();
}
