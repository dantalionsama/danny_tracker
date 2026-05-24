// Scene Tracker — Frontend (v3: flash-on-collapse, custom fields, mood theming)

// ─── Layout config ────────────────────────────────────────────────────────────

const HERO_FIELDS = ["location", "mood", "attire", "position"];
const CHIP_FIELDS = ["time", "weather"];

// ─── Mood → color map ─────────────────────────────────────────────────────────
// Each entry is [hue, saturation%, lightness%] for an HSL accent.
// Keywords are matched as substrings (case-insensitive) against the mood value.
// First match wins. Falls back to default purple if nothing matches.

const MOOD_COLORS = [
  // tense / dark
  { words: ["furious","rage","angry","anger","livid"],          hsl: [0,   70, 45] },
  { words: ["tense","anxious","nervous","fearful","scared"],    hsl: [15,  65, 45] },
  { words: ["guilty","ashamed","remorse","regret"],             hsl: [25,  55, 40] },
  // warm / bright
  { words: ["joyful","ecstatic","elated","gleeful","euphoric"], hsl: [48,  90, 52] },
  { words: ["amused","playful","teasing","cheeky","giddy"],     hsl: [38,  80, 52] },
  { words: ["proud","triumphant","confident","bold"],           hsl: [30,  75, 50] },
  { words: ["hopeful","optimistic","excited","eager"],          hsl: [55,  75, 48] },
  // tender / soft
  { words: ["tender","loving","adoring","affectionate"],        hsl: [330, 65, 58] },
  { words: ["shy","flustered","embarrassed","bashful"],         hsl: [345, 60, 60] },
  { words: ["romantic","longing","yearning","wistful"],         hsl: [310, 55, 55] },
  { words: ["content","warm","cozy","peaceful","serene"],       hsl: [160, 45, 45] },
  // cool / detached
  { words: ["sad","sorrowful","grief","heartbroken","bereft"],  hsl: [220, 55, 50] },
  { words: ["melancholy","wistful","wistfully","nostalgic"],    hsl: [240, 40, 55] },
  { words: ["distant","detached","numb","hollow","empty"],      hsl: [210, 30, 45] },
  { words: ["cold","icy","aloof","indifferent"],                hsl: [200, 50, 45] },
  // neutral default — purple
  { words: [],                                                   hsl: [258, 70, 55] },
];

function getMoodHsl(moodValue) {
  if (!moodValue) return MOOD_COLORS[MOOD_COLORS.length - 1].hsl;
  const lower = moodValue.toLowerCase();
  for (const entry of MOOD_COLORS) {
    if (entry.words.some(w => lower.includes(w))) return entry.hsl;
  }
  return MOOD_COLORS[MOOD_COLORS.length - 1].hsl;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fieldLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
function escAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Widget HTML builders ─────────────────────────────────────────────────────

function buildViewHTML(state) {
  const allKeys   = Object.keys(state);
  const heroKeys  = HERO_FIELDS.filter(k => allKeys.includes(k));
  const chipKeys  = CHIP_FIELDS.filter(k => allKeys.includes(k));
  const extraKeys = allKeys.filter(k => !HERO_FIELDS.includes(k) && !CHIP_FIELDS.includes(k));

  const chipSection = chipKeys.length ? `
    <div class="st-chip-row st-chip-row--top">
      ${chipKeys.map(key => `
        <div class="st-chip">
          <span class="st-chip-label">${fieldLabel(key)}</span>
          <span class="st-chip-value">${escHtml(state[key] || "—")}</span>
        </div>`).join("")}
    </div>` : "";

  const heroSection = [...heroKeys, ...extraKeys].map(key => `
    <div class="st-hero-row">
      <span class="st-hero-label">${fieldLabel(key)}</span>
      <span class="st-hero-value">${escHtml(state[key] || "—")}</span>
    </div>`).join("");

  return chipSection + heroSection;
}

function buildEditHTML(state, pendingFields) {
  // Existing fields
  const existing = Object.entries(state).map(([key, value]) => `
    <div class="st-edit-row" data-existing-key="${escAttr(key)}">
      <label class="st-edit-label">${fieldLabel(key)}</label>
      <input class="st-input" data-key="${escAttr(key)}" value="${escAttr(value)}" spellcheck="false" />
      ${HERO_FIELDS.includes(key) || CHIP_FIELDS.includes(key) ? "" :
        `<button class="st-del-btn" data-del-key="${escAttr(key)}" title="Remove field">×</button>`}
    </div>`).join("");

  // Pending new fields (not yet saved)
  const pending = pendingFields.map((_, i) => `
    <div class="st-edit-row st-new-row" data-pending-index="${i}">
      <input class="st-input st-key-input" data-new-key-index="${i}" placeholder="field name" spellcheck="false" />
      <input class="st-input" data-new-val-index="${i}" placeholder="value" spellcheck="false" />
      <button class="st-del-btn" data-del-pending="${i}" title="Remove">×</button>
    </div>`).join("");

  // Add field button
  const addBtn = `
    <button class="st-add-field-btn" id="st-add-field">
      <span>＋</span> Add field
    </button>`;

  return existing + pending + addBtn;
}

function buildWidget(state, editing, collapsed, pendingFields) {
  if (collapsed) {
    return `<button class="st-pill" id="st-expand" aria-label="Expand scene tracker">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
      <span class="st-pill-label">Scene</span>
    </button>`;
  }

  const hasState = Object.keys(state).length > 0;
  const headerButtons = editing
    ? `<button class="st-btn st-primary" id="st-save">Save</button>
       <button class="st-btn st-ghost" id="st-cancel">Cancel</button>`
    : `<button class="st-btn st-ghost" id="st-edit">Edit</button>`;

  return `
    <div class="st-card">
      <div class="st-header" id="st-header">
        <span class="st-title">Scene</span>
        <div class="st-header-actions">
          ${headerButtons}
          <button class="st-btn st-ghost st-collapse-btn" id="st-collapse" aria-label="Collapse">&#x2212;</button>
        </div>
      </div>
      <div class="st-body">
        ${!hasState
          ? '<p class="st-empty">Waiting for first AI message…</p>'
          : editing
            ? buildEditHTML(state, pendingFields)
            : buildViewHTML(state)}
      </div>
    </div>
  `;
}

// ─── Mood theming ─────────────────────────────────────────────────────────────

function applyMoodTheme(widgetRoot, moodValue) {
  const [h, s, l] = getMoodHsl(moodValue);
  const header = widgetRoot.querySelector("#st-header");
  const card   = widgetRoot.querySelector(".st-card");
  if (header) {
    header.style.background    = `hsla(${h}, ${s}%, ${l}%, 0.18)`;
    header.style.borderBottom  = `1px solid hsla(${h}, ${s}%, ${l}%, 0.22)`;
  }
  if (card) {
    card.style.borderColor     = `hsla(${h}, ${s}%, ${l}%, 0.28)`;
    card.style.boxShadow       = `0 2px 0 0 rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px hsla(${h},${s}%,${l}%,0.12)`;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  scene-state { display: none !important; }

  .st-card {
    width: 300px;
    font-family: var(--lumiverse-font, system-ui, sans-serif);
    color: var(--lumiverse-text);
    background: rgba(18, 14, 38, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 14px;
    overflow: hidden;
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    box-shadow: 0 2px 0 0 rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.55);
    transition: border-color 1.2s ease, box-shadow 1.2s ease;
  }
  .st-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    transition: background 1.2s ease, border-color 1.2s ease;
  }
  .st-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(255,255,255,0.35);
  }
  .st-header-actions { display: flex; gap: 5px; align-items: center; }

  .st-btn {
    font-family: inherit; font-size: 10.5px; font-weight: 600;
    padding: 3px 9px; border-radius: 20px; cursor: pointer;
    border: 1px solid transparent; line-height: 1.5;
    transition: opacity 0.12s, background 0.12s;
  }
  .st-ghost {
    background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.55);
  }
  .st-ghost:hover { background: rgba(255,255,255,0.13); color: rgba(255,255,255,0.85); }
  .st-primary { background: var(--lumiverse-accent, #7c4dff); color: #fff; }
  .st-primary:hover { opacity: 0.82; }
  .st-collapse-btn { padding: 3px 7px; font-size: 13px; line-height: 1.2; }

  .st-body { padding: 12px 12px 10px; display: flex; flex-direction: column; gap: 0; }

  .st-hero-row {
    display: flex; flex-direction: column; gap: 1px;
    padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.055);
  }
  .st-hero-row:last-of-type { border-bottom: none; }
  .st-hero-label {
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(255,255,255,0.3);
  }
  .st-hero-value {
    font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.92);
    line-height: 1.35; white-space: normal; word-break: break-word;
  }

  .st-chip-row { display: flex; flex-wrap: wrap; gap: 5px; }
  .st-chip-row--top {
    padding-bottom: 10px; margin-bottom: 4px;
    border-bottom: 1px solid rgba(255,255,255,0.055);
  }
  .st-chip {
    display: flex; flex-direction: column; gap: 1px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 8px; padding: 4px 8px 5px; flex: 1; min-width: 60px;
  }
  .st-chip-label {
    font-size: 8.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: rgba(255,255,255,0.28);
  }
  .st-chip-value {
    font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,0.82);
    white-space: normal; word-break: break-word; line-height: 1.3;
  }

  /* ── Edit mode ── */
  .st-edit-row {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.045);
  }
  .st-edit-row:last-of-type { border-bottom: none; }
  .st-edit-label {
    min-width: 64px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: rgba(255,255,255,0.28); flex-shrink: 0;
  }
  .st-input {
    flex: 1; padding: 4px 8px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 7px; color: rgba(255,255,255,0.9);
    font-size: 11.5px; font-family: inherit; outline: none; min-width: 0;
  }
  .st-key-input { max-width: 90px; flex: 0 0 90px; }
  .st-input:focus { border-color: var(--lumiverse-accent, #7c4dff); }
  .st-del-btn {
    flex-shrink: 0; background: none; border: none;
    color: rgba(255,255,255,0.2); font-size: 15px; cursor: pointer;
    padding: 0 2px; line-height: 1; transition: color 0.12s;
  }
  .st-del-btn:hover { color: rgba(255,100,100,0.8); }

  /* ── Add field button ── */
  .st-add-field-btn {
    display: flex; align-items: center; gap: 5px;
    margin-top: 8px; padding: 5px 10px;
    background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15);
    border-radius: 8px; color: rgba(255,255,255,0.35);
    font-family: inherit; font-size: 10.5px; font-weight: 600;
    cursor: pointer; width: 100%; justify-content: center;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .st-add-field-btn:hover {
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);
    border-color: rgba(255,255,255,0.3);
  }

  .st-empty {
    font-size: 11.5px; color: rgba(255,255,255,0.3);
    font-style: italic; padding: 6px 0; margin: 0;
  }

  /* ── Collapsed pill ── */
  .st-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 12px 8px 10px;
    background: rgba(18, 14, 38, 0.82); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 999px; color: rgba(255,255,255,0.6);
    cursor: pointer; font-family: inherit; font-size: 11px;
    font-weight: 600; letter-spacing: 0.06em;
    box-shadow: 0 4px 18px rgba(0,0,0,0.5);
    transition: background 0.15s, color 0.15s, box-shadow 0.4s, border-color 0.4s;
    white-space: nowrap;
  }
  .st-pill:hover { background: rgba(30,22,55,0.92); color: rgba(255,255,255,0.9); }
  .st-pill-label { text-transform: uppercase; }

  /* ── Flash animations ── */
  @keyframes st-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(124,77,255,0.55), 0 8px 32px rgba(0,0,0,0.55); }
    60%  { box-shadow: 0 0 0 6px rgba(124,77,255,0),  0 8px 32px rgba(0,0,0,0.55); }
    100% { box-shadow: 0 8px 32px rgba(0,0,0,0.55); }
  }
  .st-card.st-flash { animation: st-pulse 0.65s ease-out forwards; }

  @keyframes st-pill-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(124,77,255,0.7), 0 4px 18px rgba(0,0,0,0.5); }
    60%  { box-shadow: 0 0 0 6px rgba(124,77,255,0),  0 4px 18px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 4px 18px rgba(0,0,0,0.5); }
  }
  .st-pill.st-flash { animation: st-pill-pulse 0.65s ease-out forwards; }
`;

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setup(ctx) {
  let sceneState   = {};
  let isEditing    = false;
  let isCollapsed  = false;
  let pendingFields = []; // { key: "", val: "" } entries not yet saved

  const removeStyle = ctx.dom.addStyle(STYLES);

  const floatWidget = ctx.ui.createFloatWidget({
    width: 300,
    height: 280,
    initialPosition: { x: window.innerWidth - 320, y: 100 },
    snapToEdge: true,
    tooltip: "Scene Tracker",
    chromeless: true,
  });

  const widgetRoot = floatWidget.root;

  // ── Repaint ────────────────────────────────────────────────────────────────

  function repaint() {
    widgetRoot.innerHTML = buildWidget(sceneState, isEditing, isCollapsed, pendingFields);

    // Apply mood theming whenever the card is visible
    if (!isCollapsed) {
      applyMoodTheme(widgetRoot, sceneState.mood || "");
    }

    // Collapse / expand
    widgetRoot.querySelector("#st-expand")?.addEventListener("click", () => {
      isCollapsed = false; repaint();
    });
    widgetRoot.querySelector("#st-collapse")?.addEventListener("click", () => {
      isCollapsed = true; isEditing = false; pendingFields = []; repaint();
    });

    // Edit / cancel
    widgetRoot.querySelector("#st-edit")?.addEventListener("click", () => {
      isEditing = true; repaint();
    });
    widgetRoot.querySelector("#st-cancel")?.addEventListener("click", () => {
      isEditing = false; pendingFields = []; repaint();
    });

    // Save — collect existing edits + new fields, strip blanks
    widgetRoot.querySelector("#st-save")?.addEventListener("click", () => {
      const patch = {};

      // Existing field edits
      widgetRoot.querySelectorAll(".st-input[data-key]").forEach(input => {
        if (input.dataset.key) {
          patch[input.dataset.key] = input.value.trim() || sceneState[input.dataset.key];
        }
      });

      // New pending fields — only add if both key and value are filled
      const keyInputs = widgetRoot.querySelectorAll(".st-key-input");
      keyInputs.forEach((keyInput, i) => {
        const valInput = widgetRoot.querySelector(`[data-new-val-index="${i}"]`);
        const k = keyInput.value.trim().toLowerCase().replace(/\s+/g, "_");
        const v = valInput?.value.trim();
        if (k && v) patch[k] = v;
      });

      // Fields with del button that were deleted — remove from state
      const deletedKeys = [];
      widgetRoot.querySelectorAll("[data-del-key]").forEach(btn => {
        // If the row was removed from DOM (can't happen with innerHTML), skip.
        // We track deletions via a separate mechanism below.
      });

      sceneState = { ...sceneState, ...patch };
      // Remove any deleted custom keys tracked during this edit session
      for (const k of pendingDeletions) {
        delete sceneState[k];
      }
      pendingDeletions = [];
      isEditing = false;
      pendingFields = [];
      repaint();
      ctx.sendToBackend({ type: "manual_override", state: sceneState });
    });

    // Add field button
    widgetRoot.querySelector("#st-add-field")?.addEventListener("click", () => {
      pendingFields.push({ key: "", val: "" });
      repaint();
    });

    // Delete existing custom field
    widgetRoot.querySelectorAll("[data-del-key]").forEach(btn => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.delKey;
        pendingDeletions.push(k);
        delete sceneState[k];
        repaint();
      });
    });

    // Delete pending new row
    widgetRoot.querySelectorAll("[data-del-pending]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.delPending, 10);
        pendingFields.splice(i, 1);
        repaint();
      });
    });
  }

  // Track custom field deletions within an edit session
  let pendingDeletions = [];

  // ── Flash helpers ──────────────────────────────────────────────────────────

  function flashCard() {
    const el = widgetRoot.querySelector(".st-card");
    if (!el) return;
    el.classList.remove("st-flash");
    void el.offsetWidth;
    el.classList.add("st-flash");
  }

  function flashPill() {
    const el = widgetRoot.querySelector(".st-pill");
    if (!el) return;
    el.classList.remove("st-flash");
    void el.offsetWidth;
    el.classList.add("st-flash");
  }

  // ── Tag interceptor ────────────────────────────────────────────────────────

  const unsubTag = ctx.messages.registerTagInterceptor(
    { tagName: "scene-state", removeFromMessage: true },
    (payload) => {
      if (payload.isUser) return;
      sceneState = { ...sceneState, ...payload.attrs };
      if (!isEditing) {
        repaint();
        isCollapsed ? flashPill() : flashCard();
      }
      ctx.sendToBackend({ type: "tag_parsed", state: { ...payload.attrs } });
    }
  );

  // ── Backend messages ───────────────────────────────────────────────────────

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (payload.type === "state_updated") {
      sceneState = payload.state ?? {};
      if (!isEditing) repaint();
    }
  });

  ctx.sendToBackend({ type: "request_state" });
  repaint();

  return () => {
    unsubTag();
    unsubBackend();
    removeStyle();
    floatWidget.destroy();
  };
}
