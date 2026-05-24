# danny tracker

A Lumiverse Spindle extension that renders a floating widget tracking scene state — mood, attire, position, location, time, weather — updated automatically from hidden tags in AI messages, with manual override support.

**Features:** mood-based color theming · custom fields · collapse to pill · position memory · manual override

## Installation

1. Copy the repo URL and paste it into the Lumiverse Extensions → Install panel
2. Add the system prompt snippet below to your character card or a World Info entry set to always inject

## System Prompt Snippet

The `{{scene_state}}` macro is filled in automatically by the extension.

```
[SCENE TRACKER]
At the very end of every response, append a self-closing <scene-state> tag with the attributes below.
Never place it mid-response. Never omit it.

Attributes — update only what changed, leave others as-is:
  mood     – dominant emotional state. Lead with one anchor word from the list below, then expand with 1–2 descriptors:
               reds/oranges: furious, livid, angry | tense, anxious, nervous, fearful | guilty, ashamed, remorseful
               ambers/golds: amused, playful, giddy | proud, confident, triumphant | joyful, elated, euphoric | hopeful, excited, eager
               greens/teals: content, peaceful, serene, cozy
               pinks/mauves: tender, adoring, affectionate | shy, flustered, bashful | romantic, longing, wistful, yearning
               blues:        sad, heartbroken, grief-stricken | melancholy, nostalgic | distant, detached, numb | cold, aloof, indifferent
               If none fit, describe freely — the widget defaults to neutral purple.
               Examples: "tender, quietly overwhelmed" / "anxious but trying to seem calm" / "melancholy, touched by the moment"
  attire   – what the character is wearing (e.g. oversized hoodie, sundress, cashmere coat)
  position – physical posture or placement (e.g. seated, pacing, curled on sofa, leaning in the doorway)
  location – scene location (e.g. kitchen, rooftop, empty train, dark planetarium)
  time     – general time of day, never a clock time (e.g. late morning, dead of night, golden hour, just past midnight)
  weather  – ambient atmosphere (e.g. heavy rain, oppressive heat, crisp morning, cool artificial starlight)

Never use clock times like "10:33 AM" for the time attribute — always use a vague, impressionistic phrase.

Current state (for reference):
{{scene_state}}

Required output — always at the very end, nothing after it:
<scene-state mood="..." attire="..." position="..." location="..." time="..." weather="..."></scene-state>
[END SCENE TRACKER]
```

## Mood Color Reference

The widget header and border tint changes based on the mood anchor word:

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

Matching is first-come-first-served top to bottom, so in a compound mood like "wistful and sorrowful" the mauve entry wins since it appears first. Lead with the most dominant emotion to get the right color.

## Usage

- The widget floats over the chat — drag it anywhere, position is remembered across reloads
- After every AI message the widget updates automatically with a brief glow
- Widget collapsed to a pill? It'll still pulse when something changes
- Click **Edit** to manually override any field, then **Save**
- In edit mode, use **＋ Add field** to create custom tracked fields
- Custom fields can be deleted with the × button (core fields are protected)

## Customising Default Fields

Edit `DEFAULT_STATE` at the top of `dist/backend.js` (and mirror in `src/backend.ts`) to add, rename, or remove default fields. Update the system prompt attribute list to match.

## Building from Source

```bash
bun install
bun run build
```

The `dist/` folder contains pre-built JS — building from source is optional.

## License

MIT
