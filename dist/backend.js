// Scene Tracker — Backend v1.4
// Per-chat state storage keyed by chatId. Resets on CHAT_SWITCHED.

const DEFAULT_SCENE = { time: "unknown", weather: "unknown" };
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Matches a full <scene-state>...</scene-state> tag, across newlines
const SCENE_TAG_RE = /<scene-state>[\s\S]*?<\/scene-state>/g;
// Non-global version for single extraction (avoids lastIndex bugs)
const SCENE_TAG_EXTRACT_RE = /<scene-state>([\s\S]*?)<\/scene-state>/;

// Pulls the scene-state JSON out of a message's raw content, if present.
// Returns null if no tag or invalid JSON — caller should fall back to
// whatever the last-known-good state was rather than wiping the tracker.
function extractTagState(content) {
  if (!content) return null;
  const match = content.match(SCENE_TAG_EXTRACT_RE);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

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

  // Swipes/regenerates: the frontend's streamed-tag tracking only sees
  // whichever message is being actively generated, so a fresh swipe
  // inherits whatever the PREVIOUS swipe last wrote — not what was true
  // before that message existed. Fix: whenever the active swipe changes
  // (a new one is generated, or the user navigates between existing
  // ones), re-derive tracker state straight from that swipe's own
  // <scene-state> tag rather than trusting the frontend's running tally.
  spindle.on("MESSAGE_SWIPED", async ({ chatId, message, action, swipeId }) => {
    if (chatId !== activeChatId) return;
    if (action !== "added" && action !== "navigated") return; // ignore deleted/updated
    if (!message || !Array.isArray(message.swipes)) return;

    const swipeContent = message.swipes[swipeId];
    if (typeof swipeContent !== "string") return;

    const tagState = extractTagState(swipeContent);
    // No tag on this swipe yet (e.g. mid-stream race) — leave tracker as-is
    // rather than blanking it; a later tag_parsed or swipe event will catch up.
    if (!tagState) return;

    const current = await loadState(chatId);
    const next = {
      scene: { ...current.scene, ...(tagState.scene || {}) },
      characters: {},
    };
    if (Array.isArray(tagState.characters) && tagState.characters.length > 0) {
      for (const char of tagState.characters) {
        const { name, ...fields } = char;
        if (!name) continue;
        next.characters[name] = fields;
      }
    }

    await saveState(chatId, next);
    spindle.updateMacroValue("scene_state", buildMacroValue(next));
    spindle.sendToFrontend({ type: "state_updated", state: next, chatId });
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
      if (Array.isArray(payload.characters) && payload.characters.length > 0) {
      const updated = {};
      for (const char of payload.characters) {
      const { name, ...fields } = char;
      if (!name) continue;
      // Preserve any existing fields, then apply updates
      updated[name] = { ...(current.characters[name] || {}), ...fields };
    }
      current.characters = updated;
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
    case "cleanup_old_tags": {
      const keepCount = Number.isFinite(payload.keepCount) && payload.keepCount > 0
        ? Math.floor(payload.keepCount)
        : 3;

      try {
        const messages = await spindle.chat.getMessages(chatId);

        // Only assistant messages carry a scene-state tag. Walk in
        // chronological order, find ones with a tag, keep the last
        // `keepCount` of those untouched, strip the tag from the rest.
        const taggedMessages = messages.filter((m) => {
          const hasTag = m.role === "assistant" && SCENE_TAG_RE.test(m.content);
          SCENE_TAG_RE.lastIndex = 0; // reset — .test() advances lastIndex on a /g regex
          return hasTag;
        });

        const toStrip = taggedMessages.slice(0, Math.max(0, taggedMessages.length - keepCount));

        let cleaned = 0;
        for (const msg of toStrip) {
          const stripped = msg.content.replace(SCENE_TAG_RE, "").replace(/\n{3,}/g, "\n\n").trimEnd();
          if (stripped !== msg.content) {
            await spindle.chat.updateMessage(chatId, msg.id, { content: stripped });
            cleaned++;
          }
        }

        spindle.sendToFrontend({
          type: "cleanup_done",
          cleaned,
          kept: Math.min(keepCount, taggedMessages.length),
          chatId,
        });
        spindle.log.info(`[SceneTracker] Cleaned ${cleaned} old scene tags, kept last ${keepCount}.`);
      } catch (e) {
        spindle.log.warn("[SceneTracker] Cleanup failed: " + e.message);
        spindle.sendToFrontend({ type: "cleanup_error", message: e.message, chatId });
      }
      break;
    }
  }
});
