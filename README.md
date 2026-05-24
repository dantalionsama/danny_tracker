# Scene Tracker

A Lumiverse Spindle extension that renders a floating widget tracking scene state — mood, attire, position, location, time, weather — updated automatically from hidden tags in AI messages, with manual override support.

## Installation

1. Copy the repo URL and paste it into the Lumiverse Extensions → Install panel
2. After install, add the system prompt snippet (see below) to your character or a World Info entry set to always inject

## System Prompt Snippet

Paste this into your system prompt. The `{{scene_state}}` macro is injected automatically by the extension.

```
[SCENE TRACKER]
At the very end of every response, append a self-closing <scene-state> tag with the attributes below.
Never place it mid-response. Never omit it.

Attributes — update only what changed, leave others as-is:
  mood       – emotional state (e.g. nervous, elated, distant)
  attire     – what the character is wearing (e.g. oversized hoodie, sundress)
  position   – physical posture/location (e.g. seated, pacing, curled on sofa)
  location   – scene location (e.g. kitchen, rooftop, empty train)
  time       – time of day or narrative time (e.g. late evening, just after dawn)
  weather    – ambient atmosphere (e.g. heavy rain, oppressive heat, crisp morning)

Current state (for reference):
{{scene_state}}

Required output — always at the very end, nothing after it:
<scene-state mood="..." attire="..." position="..." location="..." time="..." weather="..."></scene-state>
[END SCENE TRACKER]
```

## Usage

- The widget floats over the chat UI — drag it anywhere, it snaps to the nearest edge
- After every AI message the widget updates automatically (a brief glow signals a change)
- Click **Edit** to manually override any field, then **Save** — the macro updates immediately so the next generation sees your edit
- State persists for 12 hours across page reloads within a session

## Customising Fields

Edit `DEFAULT_STATE` at the top of `src/backend.ts` (and mirror it in `dist/backend.js`) to add, rename, or remove fields. Update the system prompt attribute list to match.

## Building from Source

```bash
bun install
bun run build
```

The `dist/` folder already contains pre-built JS — building from source is optional.

## License

MIT
