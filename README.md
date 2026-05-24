# danny tracker

A Lumiverse Spindle extension — floating widget that tracks scene state and multiple characters simultaneously, updated automatically from hidden AI tags.

**Features:** multi-character tabs · mood-based color theming · custom fields · collapse to pill · position memory · manual override

## Installation

1. Copy the repo URL and paste it into the Lumiverse Extensions → Install panel
2. Add the system prompt snippet below to your character card or a World Info entry set to always inject

---

## System Prompt Snippet

The `{{scene_state}}` macro is filled in automatically by the extension.

```
[SCENE TRACKER]
At the very end of every response, output a single <scene-state> tag containing a JSON object.
Never place it mid-response. Never omit it.

JSON structure:
{
  "scene": {
    "time":    "general time of day — never a clock time (e.g. late morning, dead of night, golden hour)",
    "weather": "ambient atmosphere (e.g. heavy rain, oppressive heat, cool artificial starlight)"
  },
  "characters": [
    {
      "name":     "character name exactly as written",
      "mood":     "dominant emotional state — lead with an anchor word (see below), then 1–2 descriptors",
      "attire":   "what they are wearing",
      "position": "physical posture or placement",
      "location": "where they are in the scene"
    }
  ]
}

Rules:
- Include every character currently present in the scene. Omit the user.
- If a character leaves the scene, omit them from the next tag.
- Only include characters in the JSON — do not track the user.
- Never use clock times (e.g. "10:33 AM") — always use impressionistic phrases.
- Output the tag on a single line at the very end of your response, nothing after it.

Mood anchor words (lead with one, then expand freely):
  reds/oranges: furious, livid, angry | tense, anxious, nervous, fearful | guilty, ashamed, remorseful
  ambers/golds: amused, playful, giddy | proud, confident, triumphant | joyful, elated, euphoric | hopeful, excited, eager
  greens/teals: content, peaceful, serene, cozy
  pinks/mauves: tender, adoring, affectionate | shy, flustered, bashful | romantic, longing, wistful, yearning
  blues:        sad, heartbroken, grief-stricken | melancholy, nostalgic | distant, detached, numb | cold, aloof, indifferent
  If none fit, describe freely — the widget defaults to neutral purple.

Current scene state (for reference):
{{scene_state}}

Required output format — one line, at the very end:
<scene-state>{"scene":{"time":"...","weather":"..."},"characters":[{"name":"...","mood":"...","attire":"...","position":"...","location":"..."}]}</scene-state>
[END SCENE TRACKER]
```

---

## Mood Color Reference

The widget header and border tint to match the active character's mood:

| Color | Keywords |
|---|---|
| 🔴 Deep red | furious, rage, angry, livid |
| 🟠 Red-orange | tense, anxious, nervous, fearful, scared |
| 🟫 Brown-rust | guilty, ashamed, remorse, regret |
| 🟡 Amber | amused, playful, teasing, cheeky, giddy |
| 🟠 Warm orange | proud, triumphant, confident, bold |
| 💛 Golden | joyful, ecstatic, elated, gleeful, euphoric |
| 🟢 Yellow-green | hopeful, optimistic, excited, eager |
| 🩵 Teal | content, warm, cozy, peaceful, serene |
| 🩷 Rose-pink | tender, loving, adoring, affectionate |
| 💗 Hot pink | shy, flustered, embarrassed, bashful |
| 💜 Mauve | romantic, longing, yearning, wistful |
| 🔵 Steel blue | sad, sorrowful, grief, heartbroken, bereft |
| 🩶 Slate blue | melancholy, nostalgic |
| 🔘 Muted blue | distant, detached, numb, hollow, empty |
| 🧊 Icy blue | cold, icy, aloof, indifferent |
| 🟣 Purple *(default)* | anything unmatched |

Tinting is driven by the currently active tab. Switch tabs to see the card shift color.

---

## Usage

- The widget floats over chat — drag it anywhere, position is remembered across reloads
- **Scene chips** (time + weather) sit at the top, shared across all characters
- **Character tabs** appear automatically when the AI introduces a new character
- Click a tab to switch characters — the card recolors to their mood
- Hit **×** on a tab to remove that character from tracking
- After every AI message the widget updates with a brief glow; the pill pulses too if collapsed
- Click **Edit** to manually override any field (scene or active character), then **Save**
- In edit mode, use **＋ Add field** to create custom tracked fields on the active character

## Customising Default Fields

Edit `DEFAULT_STATE` at the top of `dist/backend.js` (and mirror in `src/backend.ts`) to change defaults. Update the system prompt to match.

## Building from Source

```bash
bun install
bun run build
```

`dist/` contains pre-built JS — building from source is optional.

## License

MIT
