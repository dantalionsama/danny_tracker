// Scene Tracker — Frontend (v4: multi-character tabs)
// Lumiverse calls setup(ctx) automatically.

// ─── Field config ─────────────────────────────────────────────────────────────

const SCENE_FIELDS = ["time", "weather"];          // shown above tabs, shared
const CHAR_HERO_FIELDS = ["mood", "attire", "position", "location"]; // per-character

// ─── Mood color map ───────────────────────────────────────────────────────────

const MOOD_COLORS = [
  { words: ["furious","rage","angry","anger","livid"],          hsl: [0,   70, 45] },
  { words: ["tense","anxious","nervous","fearful","scared"],    hsl: [15,  65, 45] },
  { words: ["guilty","ashamed","remorse","regret"],             hsl: [25,  55, 40] },
  { words: ["amused","playful","teasing","cheeky","giddy"],     hsl: [38,  80, 52] },
  { words: ["proud","triumphant","confident","bold"],           hsl: [30,  75, 50] },
  { words: ["joyful","ecstatic","elated","gleeful","euphoric"], hsl: [48,  90, 52] },
  { words: ["hopeful","optimistic","excited","eager"],          hsl: [55,  75, 48] },
  { words: ["tender","loving","adoring","affectionate"],        hsl: [330, 65, 58] },
  { words: ["shy","flustered","embarrassed","bashful"],         hsl: [345, 60, 60] },
  { words: ["romantic","longing","yearning","wistful"],         hsl: [310, 55, 55] },
  { words: ["content","warm","cozy","peaceful","serene"],       hsl: [160, 45, 45] },
  { words: ["sad","sorrowful","grief","heartbroken","bereft"],  hsl: [220, 55, 50] },
  { words: ["melancholy","nostalgic"],                          hsl: [240, 40, 55] },
  { words: ["distant","detached","numb","hollow","empty"],      hsl: [210, 30, 45] },
  { words: ["cold","icy","aloof","indifferent"],                hsl: [200, 50, 45] },
  { words: [],                                                   hsl: [258, 70, 55] },
];

function getMoodHsl(mood) {
  if (!mood) return MOOD_COLORS[MOOD_COLORS.length - 1].hsl;
  const lower = mood.toLowerCase();
  for (const entry of MOOD_COLORS) {
    if (entry.words.some(w => lower.includes(w))) return entry.hsl;
  }
  return MOOD_COLORS[MOOD_COLORS.length - 1].hsl;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fieldLabel(key) { return key.charAt(0).toUpperCase() + key.slice(1); }
function escAttr(str)    { return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }
function escHtml(str)    { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// ─── HTML builders ────────────────────────────────────────────────────────────

function buildSceneChips(scene) {
  if (!scene || !Object.keys(scene).length) return "";
  return `
    <div class="st-chip-row st-chip-row--top">
      ${Object.entries(scene).map(([key, value]) => `
        <div class="st-chip">
          <span class="st-chip-label">${fieldLabel(key)}</span>
          <span class="st-chip-value">${escHtml(value || "—")}</span>
        </div>`).join("")}
    </div>`;
}

function buildTabBar(characters, activeTab) {
  const names = Object.keys(characters);
  if (!names.length) return "";
  return `
    <div class="st-tab-bar">
      ${names.map(name => `
        <button class="st-tab ${name === activeTab ? "st-tab--active" : ""}" data-tab="${escAttr(name)}">
          ${escHtml(name)}
          <span class="st-tab-close" data-remove="${escAttr(name)}" title="Remove ${escHtml(name)}">×</span>
        </button>`).join("")}
    </div>`;
}

function buildCharView(fields) {
  if (!fields || !Object.keys(fields).length) {
    return `<p class="st-empty">No data yet for this character.</p>`;
  }
  const allKeys   = Object.keys(fields);
  const heroKeys  = CHAR_HERO_FIELDS.filter(k => allKeys.includes(k));
  const extraKeys = allKeys.filter(k => !CHAR_HERO_FIELDS.includes(k));
  return [...heroKeys, ...extraKeys].map(key => `
    <div class="st-hero-row">
      <span class="st-hero-label">${fieldLabel(key)}</span>
      <span class="st-hero-value">${escHtml(fields[key] || "—")}</span>
    </div>`).join("");
}

function buildCharEdit(fields, pendingFields) {
  const allKeys   = Object.keys(fields);
  const coreKeys  = CHAR_HERO_FIELDS.filter(k => allKeys.includes(k));
  const extraKeys = allKeys.filter(k => !CHAR_HERO_FIELDS.includes(k));

  const existing = [...coreKeys, ...extraKeys].map(key => `
    <div class="st-edit-row">
      <label class="st-edit-label">${fieldLabel(key)}</label>
      <input class="st-input" data-key="${escAttr(key)}" value="${escAttr(fields[key] || "")}" spellcheck="false" />
      ${CHAR_HERO_FIELDS.includes(key) ? "" :
        `<button class="st-del-btn" data-del-key="${escAttr(key)}" title="Remove">×</button>`}
    </div>`).join("");

  const pending = pendingFields.map((_, i) => `
    <div class="st-edit-row">
      <input class="st-input st-key-input" data-new-key-index="${i}" placeholder="field name" spellcheck="false" />
      <input class="st-input" data-new-val-index="${i}" placeholder="value" spellcheck="false" />
      <button class="st-del-btn" data-del-pending="${i}" title="Remove">×</button>
    </div>`).join("");

  return existing + pending + `
    <button class="st-add-field-btn" id="st-add-field">＋ Add field</button>`;
}

function buildSceneEdit(scene) {
  return Object.entries(scene).map(([key, value]) => `
    <div class="st-edit-row">
      <label class="st-edit-label">${fieldLabel(key)}</label>
      <input class="st-input" data-scene-key="${escAttr(key)}" value="${escAttr(value || "")}" spellcheck="false" />
    </div>`).join("");
}

function buildWidget(state, activeTab, isEditing, isCollapsed, pendingFields) {
  if (isCollapsed) {
    return `
      <button class="st-pill" id="st-expand" aria-label="Expand scene tracker">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
        <span class="st-pill-label">tracking...</span>
      </button>`;
  }

  const scene      = state.scene || {};
  const characters = state.characters || {};
  const charNames  = Object.keys(characters);
  const hasChars   = charNames.length > 0;
  const charFields = activeTab ? (characters[activeTab] || {}) : {};

  const headerButtons = isEditing
    ? `<button class="st-btn st-primary" id="st-save">Save</button>
       <button class="st-btn st-ghost" id="st-cancel">Cancel</button>`
    : `<button class="st-btn st-ghost" id="st-edit">Edit</button>`;

  // Body content
  let bodyContent = "";
  if (isEditing) {
    // Scene fields first, then active character fields
    bodyContent = `
      <div class="st-edit-section-label">Scene</div>
      ${buildSceneEdit(scene)}
      ${activeTab ? `
        <div class="st-edit-section-label st-edit-section-label--char">${escHtml(activeTab)}</div>
        ${buildCharEdit(charFields, pendingFields)}
      ` : ""}`;
  } else {
    bodyContent = `
      ${buildSceneChips(scene)}
      ${hasChars
        ? buildTabBar(characters, activeTab) + `
          <div class="st-char-body">
            ${buildCharView(charFields)}
          </div>`
        : `<p class="st-empty">Waiting for first AI message…</p>`}`;
  }

  return `
    <div class="st-card">
      <div class="st-header" id="st-header">
        <span class="st-title">danny is tracking...</span>
        <div class="st-header-actions">
          ${hasChars || isEditing ? headerButtons : ""}
          <button class="st-btn st-ghost st-collapse-btn" id="st-collapse" aria-label="Collapse">&#x2212;</button>
        </div>
      </div>
      <div class="st-body">${bodyContent}</div>
    </div>`;
}

// ─── Mood theming ─────────────────────────────────────────────────────────────

function applyMoodTheme(widgetRoot, mood) {
  const [h, s, l] = getMoodHsl(mood);
  const header = widgetRoot.querySelector("#st-header");
  const card   = widgetRoot.querySelector(".st-card");
  if (header) {
    header.style.background   = `hsla(${h},${s}%,${l}%,0.18)`;
    header.style.borderBottom = `1px solid hsla(${h},${s}%,${l}%,0.22)`;
  }
  if (card) {
    card.style.borderColor = `hsla(${h},${s}%,${l}%,0.28)`;
    card.style.boxShadow   = `0 2px 0 0 rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px hsla(${h},${s}%,${l}%,0.12)`;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  scene-state { display: none !important; }

  .st-card {
    width: 300px;
    font-family: var(--lumiverse-font, system-ui, sans-serif);
    color: var(--lumiverse-text);
    background: rgba(18,14,38,0.82);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 14px;
    overflow: hidden;
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    box-shadow: 0 2px 0 0 rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.55);
    transition: border-color 1.2s ease, box-shadow 1.2s ease;
  }

  /* ── Header ── */
  .st-header {
    display: flex; align-items: center; justify-content: space-between;
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

  /* ── Buttons ── */
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

  /* ── Body ── */
  .st-body { padding: 10px 12px 10px; display: flex; flex-direction: column; gap: 0; }

  /* ── Scene chips (time + weather) ── */
  .st-chip-row { display: flex; flex-wrap: wrap; gap: 5px; }
  .st-chip-row--top { padding-bottom: 10px; margin-bottom: 0; border-bottom: 1px solid rgba(255,255,255,0.055); }
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

  /* ── Tab bar ── */
  .st-tab-bar {
    display: flex; flex-wrap: wrap; gap: 4px;
    padding: 9px 0 8px;
    border-bottom: 1px solid rgba(255,255,255,0.055);
  }
  .st-tab {
    display: flex; align-items: center; gap: 4px;
    padding: 3px 8px 3px 10px;
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.45);
    font-family: inherit; font-size: 11px; font-weight: 600;
    cursor: pointer; transition: background 0.12s, color 0.12s, border-color 0.12s;
    white-space: nowrap;
  }
  .st-tab:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.75); }
  .st-tab--active {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.22);
    color: rgba(255,255,255,0.92);
  }
  .st-tab-close {
    font-size: 13px; line-height: 1; color: rgba(255,255,255,0.2);
    transition: color 0.12s; padding: 0 1px; margin-left: 1px;
  }
  .st-tab-close:hover { color: rgba(255,100,100,0.85); }

  /* ── Character fields ── */
  .st-char-body { padding-top: 8px; display: flex; flex-direction: column; }
  .st-hero-row {
    display: flex; flex-direction: column; gap: 1px;
    padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .st-hero-row:last-child { border-bottom: none; }
  .st-hero-label {
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(255,255,255,0.3);
  }
  .st-hero-value {
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.92);
    line-height: 1.35; white-space: normal; word-break: break-word;
  }

  /* ── Edit mode ── */
  .st-edit-section-label {
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(255,255,255,0.22);
    padding: 4px 0 5px; margin-bottom: 2px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .st-edit-section-label--char { margin-top: 10px; }
  .st-edit-row {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .st-edit-row:last-of-type { border-bottom: none; }
  .st-edit-label {
    min-width: 60px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: rgba(255,255,255,0.28); flex-shrink: 0;
  }
  .st-input {
    flex: 1; padding: 4px 8px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 7px; color: rgba(255,255,255,0.9);
    font-size: 11.5px; font-family: inherit; outline: none; min-width: 0;
  }
  .st-key-input { max-width: 88px; flex: 0 0 88px; }
  .st-input:focus { border-color: var(--lumiverse-accent, #7c4dff); }
  .st-del-btn {
    flex-shrink: 0; background: none; border: none;
    color: rgba(255,255,255,0.18); font-size: 15px; cursor: pointer;
    padding: 0 2px; line-height: 1; transition: color 0.12s;
  }
  .st-del-btn:hover { color: rgba(255,100,100,0.8); }
  .st-add-field-btn {
    display: flex; align-items: center; gap: 5px; margin-top: 8px; padding: 5px 10px;
    background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15);
    border-radius: 8px; color: rgba(255,255,255,0.35); font-family: inherit;
    font-size: 10.5px; font-weight: 600; cursor: pointer; width: 100%;
    justify-content: center; transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .st-add-field-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.3); }

  .st-empty {
    font-size: 11.5px; color: rgba(255,255,255,0.3);
    font-style: italic; padding: 8px 0; margin: 0;
  }

  /* ── Collapsed pill ── */
  .st-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 12px 8px 10px;
    background: rgba(18,14,38,0.82); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 999px; color: rgba(255,255,255,0.6);
    cursor: pointer; font-family: inherit; font-size: 11px;
    font-weight: 600; letter-spacing: 0.06em;
    box-shadow: 0 4px 18px rgba(0,0,0,0.5);
    transition: background 0.15s, color 0.15s;
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
  let state          = { scene: {}, characters: {} };
  let activeTab      = null;   // currently visible character tab
  let isEditing      = false;
  let isCollapsed    = false;
  let pendingFields  = [];
  let pendingDeletes = [];

  const removeStyle = ctx.dom.addStyle(STYLES);

  // Restore saved position
  const POSITION_KEY = "scene_tracker_position";
  let savedPos = { x: window.innerWidth - 320, y: 100 };
  try {
    const stored = localStorage.getItem(POSITION_KEY);
    if (stored) savedPos = JSON.parse(stored);
  } catch {}

  const floatWidget = ctx.ui.createFloatWidget({
    width: 300,
    height: 320,
    initialPosition: savedPos,
    snapToEdge: true,
    tooltip: "Scene Tracker",
    chromeless: true,
    onMove: (pos) => {
      try { localStorage.setItem(POSITION_KEY, JSON.stringify(pos)); } catch {}
    },
  });

  const widgetRoot = floatWidget.root;

  // ── Repaint ──────────────────────────────────────────────────────────────────

  function repaint() {
    // If activeTab was removed, fall back to first available character
    const charNames = Object.keys(state.characters || {});
    if (activeTab && !charNames.includes(activeTab)) {
      activeTab = charNames[0] ?? null;
    }
    if (!activeTab && charNames.length) activeTab = charNames[0];

    widgetRoot.innerHTML = buildWidget(state, activeTab, isEditing, isCollapsed, pendingFields);

    // Apply mood theme from active tab
    if (!isCollapsed && activeTab) {
      const mood = (state.characters[activeTab] || {}).mood || "";
      applyMoodTheme(widgetRoot, mood);
    }

    // ── Collapse / expand ──
    widgetRoot.querySelector("#st-expand")?.addEventListener("click", () => {
      isCollapsed = false; repaint();
    });
    widgetRoot.querySelector("#st-collapse")?.addEventListener("click", () => {
      isCollapsed = true; isEditing = false; pendingFields = []; pendingDeletes = []; repaint();
    });

    // ── Tab clicks ──
    widgetRoot.querySelectorAll(".st-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        // Don't switch if the × was clicked
        if (e.target.closest(".st-tab-close")) return;
        activeTab = tab.dataset.tab;
        repaint();
      });
    });

    // ── Tab remove (×) ──
    widgetRoot.querySelectorAll(".st-tab-close").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = btn.dataset.remove;
        delete state.characters[name];
        if (activeTab === name) activeTab = null;
        ctx.sendToBackend({ type: "remove_character", name });
        repaint();
      });
    });

    // ── Edit / cancel ──
    widgetRoot.querySelector("#st-edit")?.addEventListener("click", () => {
      isEditing = true; repaint();
    });
    widgetRoot.querySelector("#st-cancel")?.addEventListener("click", () => {
      isEditing = false; pendingFields = []; pendingDeletes = []; repaint();
    });

    // ── Save ──
    widgetRoot.querySelector("#st-save")?.addEventListener("click", () => {
      // Scene fields
      const scenePatches = {};
      widgetRoot.querySelectorAll("[data-scene-key]").forEach(input => {
        scenePatches[input.dataset.sceneKey] = input.value.trim() || state.scene[input.dataset.sceneKey];
      });
      state.scene = { ...state.scene, ...scenePatches };

      // Character fields (active tab only)
      if (activeTab) {
        const charPatches = {};
        widgetRoot.querySelectorAll(".st-input[data-key]").forEach(input => {
          charPatches[input.dataset.key] = input.value.trim() || (state.characters[activeTab] || {})[input.dataset.key];
        });
        // New pending fields
        widgetRoot.querySelectorAll(".st-key-input").forEach((keyInput, i) => {
          const valInput = widgetRoot.querySelector(`[data-new-val-index="${i}"]`);
          const k = keyInput.value.trim().toLowerCase().replace(/\s+/g, "_");
          const v = valInput?.value.trim();
          if (k && v) charPatches[k] = v;
        });
        // Apply deletions
        const current = { ...(state.characters[activeTab] || {}), ...charPatches };
        for (const k of pendingDeletes) delete current[k];
        state.characters[activeTab] = current;
        ctx.sendToBackend({ type: "manual_override", scene: scenePatches, character: activeTab, fields: state.characters[activeTab] });
      } else {
        ctx.sendToBackend({ type: "manual_override", scene: scenePatches });
      }

      pendingFields = []; pendingDeletes = [];
      isEditing = false;
      repaint();
    });

    // ── Add field ──
    widgetRoot.querySelector("#st-add-field")?.addEventListener("click", () => {
      pendingFields.push({ key: "", val: "" }); repaint();
    });

    // ── Delete existing custom field ──
    widgetRoot.querySelectorAll("[data-del-key]").forEach(btn => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.delKey;
        pendingDeletes.push(k);
        delete state.characters[activeTab][k];
        repaint();
      });
    });

    // ── Delete pending new row ──
    widgetRoot.querySelectorAll("[data-del-pending]").forEach(btn => {
      btn.addEventListener("click", () => {
        pendingFields.splice(parseInt(btn.dataset.delPending, 10), 1); repaint();
      });
    });
  }

  // ── Flash helpers ────────────────────────────────────────────────────────────

  function flashCard() {
    const el = widgetRoot.querySelector(".st-card");
    if (!el) return;
    el.classList.remove("st-flash"); void el.offsetWidth; el.classList.add("st-flash");
  }

  function flashPill() {
    const el = widgetRoot.querySelector(".st-pill");
    if (!el) return;
    el.classList.remove("st-flash"); void el.offsetWidth; el.classList.add("st-flash");
  }

  // ── Tag interceptor ──────────────────────────────────────────────────────────
  // Reads a single JSON blob from tag inner content:
  // <scene-state>{"scene":{...},"characters":[{"name":"Gilgamesh",...}]}</scene-state>

  const unsubTag = ctx.messages.registerTagInterceptor(
    { tagName: "scene-state", removeFromMessage: true },
    (payload) => {
      if (payload.isUser) return;
      try {
        const data = JSON.parse(payload.content || payload.innerText || "{}");

        // Merge scene fields
        if (data.scene) state.scene = { ...state.scene, ...data.scene };

        // Merge characters — auto-create new tabs
        if (Array.isArray(data.characters)) {
          for (const char of data.characters) {
            const { name, ...fields } = char;
            if (!name) continue;
            state.characters[name] = { ...(state.characters[name] || {}), ...fields };
            // Auto-switch to newly introduced character
            if (!activeTab) activeTab = name;
          }
        }

        if (!isEditing) {
          repaint();
          isCollapsed ? flashPill() : flashCard();
        }

        ctx.sendToBackend({ type: "tag_parsed", scene: data.scene || {}, characters: data.characters || [] });
      } catch (e) {
        ctx.log?.warn("[SceneTracker] Failed to parse tag JSON: " + e.message);
      }
    }
  );

  // ── Backend messages ─────────────────────────────────────────────────────────

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (payload.type === "state_updated") {
      state = payload.state ?? { scene: {}, characters: {} };
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
