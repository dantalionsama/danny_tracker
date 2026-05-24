declare const spindle: import('lumiverse-spindle-types').SpindleAPI

// ─── Config ───────────────────────────────────────────────────────────────────
// Edit DEFAULT_STATE to add, rename, or remove tracked fields.
// Keep keys in sync with the system prompt and dist/backend.js.

const DEFAULT_STATE: Record<string, string> = {
  mood:     'neutral',
  attire:   'casual',
  position: 'standing',
  location: 'unknown',
  time:     'unknown',
  weather:  'clear',
}

const STORAGE_KEY = 'scene_state.json'
const TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadState(): Promise<Record<string, string>> {
  try {
    const raw = await spindle.ephemeral.read(STORAGE_KEY)
    return JSON.parse(raw)
  } catch {
    return { ...DEFAULT_STATE }
  }
}

async function saveState(state: Record<string, string>): Promise<void> {
  await spindle.ephemeral.write(STORAGE_KEY, JSON.stringify(state), { ttlMs: TTL_MS })
}

function buildMacroValue(state: Record<string, string>): string {
  return Object.entries(state).map(([k, v]) => `${k}: ${v}`).join(' | ')
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

;(async () => {
  spindle.registerMacro({
    name: 'scene_state',
    category: 'extension:scene_tracker',
    description: 'Current scene state (mood, attire, position, etc.) for the system prompt.',
    returnType: 'string',
    handler: '',
  })

  const initial = await loadState()
  spindle.updateMacroValue('scene_state', buildMacroValue(initial))
  spindle.sendToFrontend({ type: 'state_updated', state: initial })
  spindle.log.info('[SceneTracker] Ready — ' + JSON.stringify(initial))
})()

// ─── Message router ───────────────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload: any, _userId) => {
  switch (payload.type) {
    case 'tag_parsed': {
      const current = await loadState()
      const next = { ...current, ...(payload.state ?? {}) }
      await saveState(next)
      spindle.updateMacroValue('scene_state', buildMacroValue(next))
      spindle.sendToFrontend({ type: 'state_updated', state: next })
      spindle.log.info('[SceneTracker] Tag parsed → ' + JSON.stringify(next))
      break
    }
    case 'manual_override': {
      const current = await loadState()
      const next = { ...current, ...(payload.state ?? {}) }
      await saveState(next)
      spindle.updateMacroValue('scene_state', buildMacroValue(next))
      spindle.log.info('[SceneTracker] Manual override → ' + JSON.stringify(next))
      break
    }
    case 'request_state': {
      const state = await loadState()
      spindle.sendToFrontend({ type: 'state_updated', state })
      break
    }
  }
})
