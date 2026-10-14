const GROQ_API_KEY = "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";

export async function generateScript(env, input) {
  const apiKey = env.GROQ_API_KEY || GROQ_API_KEY;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `မြန်မာဘာသာဖြင့် AI video ဇာတ်ညွှန်းရေးပေးပါ။ ခေါင်းစဉ်: ${input.topic}`
          }
        ],
        max_tokens: 4000
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Groq API error");
  }

  return data.choices[0].message.content;
}
