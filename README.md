# Danny's Tracker

A Lumiverse Spindle extension — floating widget that tracks scene state and multiple characters simultaneously, updated automatically from hidden AI tags.

**Features:** multi-character tabs · mood-based color theming · custom fields · collapse to pill · position memory · manual override · in-world date tracking

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
    "date":    "a specific date — adapt format to the setting (e.g. April 19 | PG-6, Day 14 | the 3rd of Harvestmonth)",
    "time":    "clock time (e.g. 11:15 PM, 2:47 AM)",
    "weather": "ambient atmosphere (e.g. heavy rain, oppressive heat, cool artificial starlight)"
  },
  "characters": [
    {
      "name":     "character name exactly as written",
      "mood":     "one anchor word | one short phrase only (e.g. proud | quietly ashamed of it)",
      "attire":   "what they are wearing",
      "position": "physical posture or placement",
      "location": "where they are in the scene"
    }
  ]
}

RULES:
WHO GETS A TRACKER ENTRY
Named characters only. A character earns an entry when they have:
— a name that has been established in the scene or on the card
— a meaningful, recurring presence this session
The waiter who refills the coffee once does not get an entry. The detective who has been in
three scenes does. If a character is unnamed or purely atmospheric, they stay in the prose
where they belong — not in the JSON. An unnamed figure who acquires a name mid-scene gets
their first entry then, not before.

WHO DOES NOT GET A TRACKER ENTRY
— background characters without established names
— NPCs who appear once to serve a beat and leave
— anyone whose tab would clutter the widget more than it clarifies the scene

SCENE FIELDS
Date: always a specific date, never vague. Adapt the format to match the setting's calendar
or lore — if the world uses a non-standard system (e.g. post-apocalyptic cycles, fantasy
months, in-universe eras), use that. If no date system has been established, default to a
real calendar date.
Time: a specific clock time (e.g. "2:47 AM", "11:15 PM"). Update when the narrative suggests
time has passed — don't rephrase if the scene hasn't moved.
Weather: ambient atmosphere in a short phrase. Update only when the scene shifts meaningfully.
If neither has changed since the last beat, carry them forward exactly — do not rephrase for variety.

MOOD — lead with one anchor word from the list below, followed by a pipe and a single short
qualifier phrase. Keep the total under ~6 words. Do not elaborate beyond that.
Anchor words:
- furious, livid, angry, tense, anxious, nervous, fearful, guilty, ashamed, remorseful
- amused, playful, giddy, proud, confident, triumphant, joyful, elated, euphoric, hopeful, excited, eager
- content, peaceful, serene, cozy
- tender, adoring, affectionate, shy, flustered, bashful, romantic, longing, wistful, yearning
- sad, heartbroken, grief-stricken, melancholy, nostalgic, distant, detached, numb, cold, aloof, indifferent
(if none fit, use a single descriptive word | short qualifier)

Current scene state (for reference):
{{scene_state}}

Required output format — one line, at the very end, nothing after it:
<scene-state>{"scene":{"date":"...","time":"...","weather":"..."},"characters":[{"name":"...","mood":"...","attire":"...","position":"...","location":"..."}]}</scene-state>
[END SCENE TRACKER]
```

---

## Mood Color Reference

The widget header and border tint to match the active character's mood:

| Color | Keywords |
|---|---|
| 🔴 Deep red | furious, livid, angry |
| 🟠 Red-orange | tense, anxious, nervous, fearful |
| 🟫 Brown-rust | guilty, ashamed, remorseful |
| 🟡 Amber | amused, playful, giddy |
| 🟠 Warm orange | proud, confident, triumphant |
| 💛 Golden | joyful, elated, euphoric |
| 🟢 Yellow-green | hopeful, excited, eager |
| 🩵 Teal | content, peaceful, serene, cozy |
| 🩷 Rose-pink | tender, adoring, affectionate |
| 💗 Hot pink | shy, flustered, bashful |
| 💜 Mauve | romantic, longing, wistful, yearning |
| 🔵 Steel blue | sad, heartbroken, grief-stricken |
| 🩶 Slate blue | melancholy, nostalgic |
| 🔘 Muted blue | distant, detached, numb |
| 🧊 Icy blue | cold, aloof, indifferent |
| 🟣 Purple *(default)* | anything unmatched |

Tinting is driven by the currently active tab. Switch tabs to see the card shift color.

---

## Usage

- The widget floats over chat — drag it anywhere, position is remembered across reloads
- **Scene chips** (date, time + weather) sit at the top, shared across all characters
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