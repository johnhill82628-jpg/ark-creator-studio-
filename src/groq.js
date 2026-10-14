
export async function generateScript(env, input) {
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY Secret မတွေ့ပါ။");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are a professional Myanmar AI video script writer. Write complete, engaging scripts in the requested language."
          },
          {
            role: "user",
            content: [
              `Topic: ${input.topic}`,
              `Type: ${input.contentType || "AI Video"}`,
              `Duration: ${input.duration || "60 seconds"}`,
              `Language: ${input.language || "Myanmar"}`,
              `Style: ${input.style || "Cinematic"}`,
              "Generate a complete script with scenes, narration, dialogue and sound effects where appropriate."
            ].join("\n")
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || `Groq API Error: ${response.status}`
    );
  }

  return data.choices[0].message.content.trim();
}
