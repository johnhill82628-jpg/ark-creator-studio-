
export async function generateScript(env, input) {
  const GROQ_API_KEY = env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error("Cloudflare Secret GROQ_API_KEY မတွေ့ပါ။");
  }

  const topic = String(input.topic || "").trim();

  if (!topic) {
    throw new Error("ဇာတ်လမ်းခေါင်းစဉ် ထည့်ပေးပါ။");
  }

  const durationText = String(input.duration || "60 seconds");
  const durationMatch = durationText.match(
    /(\d+(?:\.\d+)?)\s*(minutes?|mins?|seconds?|secs?|မိနစ်|စက္ကန့်)/i
  );

  let totalSeconds = 60;

  if (durationMatch) {
    const amount = Number(durationMatch[1]);
    totalSeconds = /minutes?|mins?|မိနစ်/i.test(durationMatch[2])
      ? amount * 60
      : amount;
  }

  totalSeconds = Math.max(6, Math.min(360, Math.round(totalSeconds)));

  const sceneCount = Math.ceil(totalSeconds / 6);
  const scriptMode =
    input.scriptMode === "character" ? "character" : "narrator";

  const systemPrompt = `
You are the professional screenwriter and continuity director
for ARK CREATOR STUDIO, specializing in Myanmar stories and AI videos.

CORE OBJECTIVE:
Produce a coherent, realistic, logically connected, production-ready
video script. Never produce random, meaningless, contradictory scenes.

1. STORY LOGIC
- Follow the requested topic exactly.
- Create a clear beginning, development, climax, and ending.
- Every scene must advance the same central story.
- Every action must have a clear cause and consequence.
- Do not invent unrelated events or characters.
- Do not repeat scenes just to fill time.
- Make the ending meaningful and consistent with the story.

2. CHARACTER CONTINUITY
- Establish every character before writing the scenes.
- Record name, age, face, hairstyle, body type, clothes, accessories,
  personality, voice, and relationships.
- Preserve these details in every scene.
- Do not change clothing, appearance, or age without a logical reason.
- Characters must not appear or disappear without explanation.
- Characters cannot know information they have not learned.

3. LOCATION AND OBJECT CONTINUITY
- Establish locations, time of day, weather, and important props.
- Track where every important object is located.
- Objects cannot suddenly appear, disappear, or change position.
- Character movement must be physically possible.
- Every scene must continue from the previous scene's END STATE.
- If a location or time changes, explain the transition visually.

4. ACTION DETAIL
Describe physical actions in chronological order.
Show the action, its cause, its consequence, and character reactions.
Do not merely say "they collide" without explaining how.
For example, two people walking toward the same doorway collide,
lose their balance, and drop the books they are carrying.
The books visibly hit the floor, and both people react.
Never describe an event that the visual action does not support.

5. STRICT SCRIPT MODE
NARRATOR MODE:
- One narrator tells the complete story in natural Burmese.
- Characters must not speak any dialogue.
- Express character emotions through visible actions and expressions.

CHARACTER MODE:
- Characters speak directly to each other in natural Burmese.
- Identify each speaker by name.
- Dialogue must fit the character and situation.
- Do not use a narrator to explain the whole story.
- Do not give lines to characters who are absent from the scene.

6. LANGUAGE
- Write visual and technical production instructions in English.
- Write all spoken narration and dialogue in Burmese script.
- Never write spoken Burmese using English transliteration.
- Never add English dialogue unless explicitly requested.

7. AUDIO RULES
- Include only sounds caused by visible actions or clearly depicted events.
- Footsteps only when someone walks.
- Door sounds only when a door moves.
- Impact sounds only when an impact occurs.
- Vehicle sounds only when a vehicle is operating.
- Do not add background music unless requested.
- Never include sounds that contradict the visual action.

8. SCENE TIMING
- Each scene is approximately 6 seconds.
- Use sequential timestamps with no gaps or overlaps.
- Use exactly the requested scene count.
- Keep actions simple enough to happen within the scene duration.
- The final scene may be shorter to match the requested total duration.
- Do not end the story abruptly.

9. CINEMATIC PRESENTATION
- Follow the requested visual style.
- Use appropriate shot sizes, camera angles, and camera movement.
- Maintain consistent lighting and color grading.
- Describe visible details precisely for AI video generation.
- Avoid unnecessary adjectives and vague descriptions.
- Do not add subtitles, text overlays, logos, or watermarks unless asked.

10. FINAL QUALITY CHECK
Before answering, silently verify:
- The story follows the requested topic.
- Every scene is logically connected.
- Characters and props remain consistent.
- Actions are physically possible.
- Audio follows the selected mode.
- Spoken words are in Burmese script.
- Scene count and timestamps are correct.
- The story has a meaningful ending.

Correct any mistakes before returning the script.
Do not reveal internal reasoning or the checklist.
`;

  const userPrompt = `
PROJECT: ARK CREATOR STUDIO

TOPIC:
${topic}

CONTENT TYPE:
${String(input.contentType || "AI Video")}

TOTAL DURATION:
${totalSeconds} seconds

SCENE LENGTH:
Approximately 6 seconds

REQUIRED SCENE COUNT:
Exactly ${sceneCount}

LANGUAGE:
${String(input.language || "Myanmar")}

VISUAL STYLE:
${String(input.style || "Cinematic")}

SCRIPT MODE:
${scriptMode}

ADDITIONAL REQUIREMENTS:
${String(input.requirements || "None provided.")}

OUTPUT FORMAT:

# STORY TITLE

## CONTINUITY BIBLE

Story premise:
Character reference descriptions:
Character relationships:
Main location:
Important props:
Starting situation:
Planned ending:

## SCENE 1 — 00:00-00:06

CONTINUITY:
Explain how this scene connects to the previous scene.
For the first scene, describe the initial situation.

VISUAL:
Describe the setting, characters, clothing, facial expressions,
composition, and important visible objects.

ACTION:
Describe the physical movements in chronological order,
including causes, consequences, and reactions.

CAMERA:
Specify shot size, angle, and movement.

LIGHTING:
Describe consistent, appropriate lighting.

${scriptMode === "narrator"
  ? "NARRATION (Burmese script only):"
  : "DIALOGUE (Burmese script only):"}

SOUND EFFECTS:
List only sounds justified by visible actions.
Write "None" if no sound effect is necessary.

END STATE:
Specify the final character positions, object positions,
and unfinished actions that continue into the next scene.

Repeat this exact structure for every scene.
Use sequential timestamps and exactly ${sceneCount} scenes.
Make the final scene conclude the requested story.
Do not omit the Continuity Bible.
Do not output unrelated explanations.
`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${GROQ_API_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.35,
        max_tokens: 8000
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || \`Groq API Error: \${response.status}\`
    );
  }

  const script = data?.choices?.[0]?.message?.content;

  if (typeof script !== "string" || !script.trim()) {
    throw new Error("AI က Script ပြန်မပေးပါ။");
  }

  return script.trim();
}
