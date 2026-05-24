// Scene Tracker — Backend (v2: multi-character)
// Lumiverse injects `spindle` as a global.

const STORAGE_KEY = "scene_state.json";
const TTL_MS = 12 * 60 * 60 * 1000;

const DEFAULT_STATE = {
  scene: { time: "unknown", weather: "clear" },
  characters: {},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadState() {
  try {
    const raw = await spindle.ephemeral.read(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    // Migrate old flat-state saves gracefully
    if (!parsed.scene && !parsed.characters) {
      return { ...DEFAULT_STATE };
    }
    return parsed;
  } catch {
    return { scene: { ...DEFAULT_STATE.scene }, characters: {} };
  }
}

async function saveState(state) {
  await spindle.ephemeral.write(STORAGE_KEY, JSON.stringify(state), { ttlMs: TTL_MS });
}

/**
 * Builds the {{scene_state}} macro string.
 * Scene: late evening, heavy rain
 * Gilgamesh — mood: proud | attire: golden armor | position: reclined on throne
 * Emiya — mood: tired | attire: red coat | position: standing in the doorway
 */
function buildMacroValue(state) {
  const sceneStr = Object.entries(state.scene || {})
    .map(([k, v]) => v).join(", ");

  const charLines = Object.entries(state.characters || {})
    .map(([name, fields]) => {
      const fieldStr = Object.entries(fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      return `${name} — ${fieldStr}`;
    });

  return [`Scene: ${sceneStr}`, ...charLines].join("\n");
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  spindle.registerMacro({
    name: "scene_state",
    category: "extension:scene_tracker",
    description: "Current scene state and all tracked characters.",
    returnType: "string",
    handler: "",
  });

  const initial = await loadState();
  spindle.updateMacroValue("scene_state", buildMacroValue(initial));
  spindle.sendToFrontend({ type: "state_updated", state: initial });
  spindle.log.info("[SceneTracker] Ready — " + JSON.stringify(initial));
})();

// ─── Message router ───────────────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload) => {
  switch (payload.type) {

    case "tag_parsed": {
      const current = await loadState();

      // Merge scene-level fields
      if (payload.scene) {
        current.scene = { ...current.scene, ...payload.scene };
      }

      // Merge each character — create tab if new, merge fields if existing
      if (Array.isArray(payload.characters)) {
        for (const char of payload.characters) {
          const { name, ...fields } = char;
          if (!name) continue;
          current.characters[name] = { ...(current.characters[name] || {}), ...fields };
        }
      }

      await saveState(current);
      spindle.updateMacroValue("scene_state", buildMacroValue(current));
      spindle.sendToFrontend({ type: "state_updated", state: current });
      spindle.log.info("[SceneTracker] Tag parsed → " + JSON.stringify(current));
      break;
    }

    case "manual_override": {
      const current = await loadState();

      if (payload.scene) {
        current.scene = { ...current.scene, ...payload.scene };
      }
      if (payload.character && payload.fields) {
        current.characters[payload.character] = {
          ...(current.characters[payload.character] || {}),
          ...payload.fields,
        };
      }

      await saveState(current);
      spindle.updateMacroValue("scene_state", buildMacroValue(current));
      spindle.log.info("[SceneTracker] Manual override → " + JSON.stringify(current));
      break;
    }

    case "remove_character": {
      const current = await loadState();
      delete current.characters[payload.name];
      await saveState(current);
      spindle.updateMacroValue("scene_state", buildMacroValue(current));
      spindle.sendToFrontend({ type: "state_updated", state: current });
      spindle.log.info("[SceneTracker] Removed character: " + payload.name);
      break;
    }

    case "request_state": {
      const state = await loadState();
      spindle.sendToFrontend({ type: "state_updated", state });
      break;
    }
  }
});
