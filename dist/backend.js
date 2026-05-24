// Scene Tracker — Backend
// Handles: macro registration, state persistence, frontend message routing.
// Lumiverse injects `spindle` as a global — no imports needed.

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  mood:     "neutral",
  attire:   "casual",
  position: "standing",
  location: "unknown",
  time:     "unknown",
  weather:  "clear",
};

const STORAGE_KEY = "scene_state.json";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadState() {
  try {
    const raw = await spindle.ephemeral.read(STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveState(state) {
  await spindle.ephemeral.write(STORAGE_KEY, JSON.stringify(state), {
    ttlMs: TTL_MS,
  });
}

/**
 * Serialises state for the {{scene_state}} macro.
 * Output: "mood: wistful | attire: evening gown | position: seated | …"
 */
function buildMacroValue(state) {
  return Object.entries(state)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ");
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  // Register the macro (push model — value is always pre-pushed, no RPC lag)
  spindle.registerMacro({
    name: "scene_state",
    category: "extension:scene_tracker",
    description:
      "Current scene state (mood, attire, position, etc.) for the system prompt.",
    returnType: "string",
    handler: "", // push model — handler body unused
  });

  const initial = await loadState();
  spindle.updateMacroValue("scene_state", buildMacroValue(initial));
  spindle.sendToFrontend({ type: "state_updated", state: initial });

  spindle.log.info("[SceneTracker] Ready — " + JSON.stringify(initial));
})();

// ─── Message router ───────────────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload, _userId) => {
  switch (payload.type) {

    // Frontend parsed a <scene-state> tag from an AI message
    case "tag_parsed": {
      const current = await loadState();
      const next = { ...current, ...(payload.state ?? {}) };
      await saveState(next);
      spindle.updateMacroValue("scene_state", buildMacroValue(next));
      spindle.sendToFrontend({ type: "state_updated", state: next });
      spindle.log.info("[SceneTracker] Tag parsed → " + JSON.stringify(next));
      break;
    }

    // User saved manual edits via the widget
    case "manual_override": {
      const current = await loadState();
      const next = { ...current, ...(payload.state ?? {}) };
      await saveState(next);
      spindle.updateMacroValue("scene_state", buildMacroValue(next));
      // No echo needed — frontend already applied the edit optimistically
      spindle.log.info("[SceneTracker] Manual override → " + JSON.stringify(next));
      break;
    }

    // Widget requesting initial state (e.g. after page reload)
    case "request_state": {
      const state = await loadState();
      spindle.sendToFrontend({ type: "state_updated", state });
      break;
    }

    default:
      spindle.log.warn("[SceneTracker] Unknown message type: " + payload.type);
  }
});
