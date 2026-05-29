// Scene Tracker — Backend v1.4
// Per-chat state storage keyed by chatId. Resets on CHAT_SWITCHED.

const DEFAULT_SCENE = { time: "unknown", weather: "unknown" };
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function storageKey(chatId) {
  return `scene_state_${chatId}.json`;
}

function buildMacroValue(state) {
  const scene = state.scene || {};
  const characters = state.characters || {};
  const sceneStr = Object.entries(scene).map(([k, v]) => `${k}: ${v}`).join(", ");
  const charStr = Object.entries(characters)
    .map(([name, fields]) => {
      const f = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(" | ");
      return `${name} — ${f}`;
    })
    .join("\n");
  return [sceneStr, charStr].filter(Boolean).join("\n");
}

async function loadState(chatId) {
  try {
    const raw = await spindle.ephemeral.read(storageKey(chatId));
    return JSON.parse(raw);
  } catch {
    return { scene: { ...DEFAULT_SCENE }, characters: {} };
  }
}

async function saveState(chatId, state) {
  await spindle.ephemeral.write(storageKey(chatId), JSON.stringify(state), { ttlMs: TTL_MS });
}

// Track current active chat
let activeChatId = null;

(async () => {
  spindle.registerMacro({
    name: "scene_state",
    category: "extension:scene_tracker",
    description: "Current scene state for the system prompt.",
    returnType: "string",
    handler: "",
  });

  // Discover active chat on boot
  try {
    const active = await spindle.chats.getActive();
    if (active) {
      activeChatId = active.id;
      const state = await loadState(activeChatId);
      spindle.updateMacroValue("scene_state", buildMacroValue(state));
      spindle.sendToFrontend({ type: "state_updated", state, chatId: activeChatId });
    }
  } catch (e) {
    spindle.log.warn("[SceneTracker] Could not get active chat on boot: " + e.message);
  }

  // Listen for chat switches — key state per chat
  spindle.on("CHAT_SWITCHED", async ({ chatId }) => {
  activeChatId = chatId;
  if (!chatId) {
    spindle.sendToFrontend({ type: "state_reset" });
    return;
  }
  const state = await loadState(chatId);
  spindle.updateMacroValue("scene_state", buildMacroValue(state));
  // Send exactly once — don't also handle "request_state" racing with this
  spindle.sendToFrontend({ type: "state_updated", state, chatId });
});

  spindle.log.info("[SceneTracker] Ready.");
})();

spindle.onFrontendMessage(async (payload) => {
  const chatId = activeChatId;
  if (!chatId) return;

  switch (payload.type) {
    case "tag_parsed": {
      const current = await loadState(chatId);
      if (payload.scene) current.scene = { ...current.scene, ...payload.scene };
      if (Array.isArray(payload.characters)) {
        for (const char of payload.characters) {
          const { name, ...fields } = char;
          if (!name) continue;
          current.characters[name] = { ...(current.characters[name] || {}), ...fields };
        }
      }
      await saveState(chatId, current);
      spindle.updateMacroValue("scene_state", buildMacroValue(current));
      spindle.sendToFrontend({ type: "state_updated", state: current, chatId });
      break;
    }
    case "remove_character": {
      const current = await loadState(chatId);
      delete current.characters[payload.name];
      await saveState(chatId, current);
      spindle.updateMacroValue("scene_state", buildMacroValue(current));
      break;
    }
    case "request_state": {
      // Only respond if we haven't just sent state via CHAT_SWITCHED
      // (frontend sends this on setup, but CHAT_SWITCHED will already cover it)
      if (!activeChatId) return;
      const state = await loadState(activeChatId);
      spindle.sendToFrontend({ type: "state_updated", state, chatId: activeChatId });
      break;
    }
  }
});
