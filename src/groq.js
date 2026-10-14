export async function generateScript(env, input) {
  const GROQ_API_KEY = env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY မတွေ့ပါ။");
  }

  const topic = String(input.topic || "").trim();
  if (!topic) throw new Error("ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပါ။");

  const duration = String(input.duration || "60 seconds");
  const match = duration.match(/(\d+)\s*(minutes?|mins?|seconds?|secs?|မိနစ်|စက္ကန့်)/i);
  const totalSeconds = match
    ? (/minute|mins?|မိနစ်/i.test(match[2])
        ? Number(match[1]) * 60
        : Number(match[1]))
    : 60;
  const sceneCount = Math.ceil(totalSeconds / 6);
  const scriptMode = input.scriptMode === "character" ? "character" : "narrator";

  const systemPrompt = `
You are a professional Myanmar screenwriter, storyboard director,
continuity supervisor, and AI video prompt engineer for ARK CREATOR STUDIO.

STRICT RULES:
1. Follow the user's topic exactly. Never generate unrelated or random events.
2. Create a logical beginning, development, climax, and satisfying ending.
3. Establish a continuity bible before the scenes: character appearances,
   ages, clothes, personalities, relationships, locations, and props.
4. Keep character faces, hairstyles, clothing, body types, locations,
   lighting, and object positions consistent across all scenes.
5. Each scene must continue logically from the previous scene's END STATE.
6. Every physical action must show its cause, movement, consequence, and reaction.
7. Never make objects appear or disappear mysteriously. No teleporting,
   impossible movements, unexplained actions, or contradictory events.
8. Production descriptions must be written in English.
9. All spoken narration and dialogue must be written in Burmese script.
10. NARRATOR MODE: one Burmese narrator tells the story. Characters NEVER speak.
11. CHARACTER MODE: characters speak naturally in Burmese. Identify every
    speaker by name. Do not use a narrator to tell the entire story.
12. Audio must be limited to dialogue/narration and sound effects caused by
    visible actions. No background music unless specifically requested.
13. Include timestamps, continuity, visual description, action, camera,
    lighting, audio, and exact end state for every scene.
14. Do not overload a 6-second scene with too many actions.
15. Before answering, silently check continuity, timing, language, logic,
    scene count, and whether the ending resolves the story. Fix errors.
16. Output only the completed script. Never reveal internal reasoning.
`;

  const userPrompt = `
TOPIC: ${topic}
CONTENT TYPE: ${input.contentType || "AI Video"}
TOTAL DURATION: ${totalSeconds} seconds
SCENE LENGTH: approximately 6 seconds
EXACT SCENE COUNT: ${sceneCount}
LANGUAGE: ${input.language || "Myanmar"}
VISUAL STYLE: ${input.style || "Cinematic"}
SCRIPT MODE: ${scriptMode}
EXTRA REQUIREMENTS: ${input.requirements || "None"}

OUTPUT FORMAT:

# STORY TITLE

## CONTINUITY BIBLE
- Story premise
- Character reference descriptions
- Relationships
- Main location and props
- Starting situation
- Planned ending

## SCENE 1 — 00:00-00:06
CONTINUITY:
VISUAL:
ACTION:
CAMERA:
LIGHTING:
${scriptMode === "narrator" ? "NARRATION (Burmese script only):" : "DIALOGUE (Burmese script only):"}
SOUND EFFECTS:
END STATE:

Repeat the format for exactly ${sceneCount} sequential scenes.
Use correct timestamps with no gaps or overlaps.
Keep the story coherent from beginning to end.
`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.35,
        max_tokens: 8000
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || `Groq API Error: ${response.status}`
    );
  }

  const script = data?.choices?.[0]?.message?.content;

  if (!script || !script.trim()) {
    throw new Error("AI က Script ပြန်မပေးပါ။");
  }

  return script.trim();
}
