// Scene Tracker — Frontend v1.4
// Per-chat state, icon-driven UI, no edit mode.

// ─── Field config ─────────────────────────────────────────────────────────────

const CHAR_FIELDS = ["mood", "attire", "position", "location"];

// ─── Icons ────────────────────────────────────────────────────────────────────
// SVG strings keyed by field name. Inline so no external deps needed.

const ICONS = {
  time: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`,
  date: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  weather: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9Z"/></svg>`,
  mood: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  attire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>`,
  position: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><path d="M6.8 20a6 6 0 0 1 10.4 0"/></svg>`,
  location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
};

function icon(key) {
  return ICONS[key] ? `<span class="st-icon">${ICONS[key]}</span>` : "";
}

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

function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// ─── HTML builders ────────────────────────────────────────────────────────────

function buildSceneRow(key, value) {
  return `
    <div class="st-scene-row">
      ${icon(key)}
      <span class="st-scene-value">${escHtml(value || "—")}</span>
    </div>`;
}

function buildCharCard(fields) {
  if (!fields || !Object.keys(fields).length) {
    return `<p class="st-empty">No data yet.</p>`;
  }
  const keys = CHAR_FIELDS.filter(k => k in fields);
  const extra = Object.keys(fields).filter(k => !CHAR_FIELDS.includes(k));
  return [...keys, ...extra].map(key => `
    <div class="st-char-row">
      ${icon(key)}
      <div class="st-char-text">
        <span class="st-char-label">${key}</span>
        <span class="st-char-value">${escHtml(fields[key] || "—")}</span>
      </div>
    </div>`).join("");
}

function buildTabBar(characters, activeTab) {
  return Object.keys(characters).map(name => `
    <button class="st-tab ${name === activeTab ? "st-tab--active" : ""}" data-tab="${escAttr(name)}">
      <span class="st-tab-name">${escHtml(name)}</span>
      <span class="st-tab-close" data-remove="${escAttr(name)}">×</span>
    </button>`).join("");
}

function buildWidget(state, activeTab, isCollapsed) {
  if (isCollapsed) {
    return `
      <button class="st-pill" id="st-expand" aria-label="Expand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
        <span>tracking...</span>
      </button>`;
  }

  const scene      = state.scene || {};
  const characters = state.characters || {};
  const charNames  = Object.keys(characters);
  const hasChars   = charNames.length > 0;
  const charFields = activeTab ? (characters[activeTab] || {}) : {};

  return `
    <div class="st-card">
      <div class="st-header" id="st-header">
        <span class="st-title">danny is tracking...</span>
        <button class="st-collapse-btn" id="st-collapse" aria-label="Collapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div class="st-scene-section">
        <div class="st-scene-row st-scene-row--inline">
          ${icon("date")}<span class="st-scene-value">${escHtml(scene.date || "—")}</span>
          <span class="st-scene-divider">·</span>
          ${icon("time")}<span class="st-scene-value">${escHtml(scene.time || "—")}</span>
        </div>
        ${buildSceneRow("weather", scene.weather)}
      </div>

      ${hasChars ? `
        <div class="st-tab-bar">${buildTabBar(characters, activeTab)}</div>
        <div class="st-char-section">${buildCharCard(charFields)}</div>
      ` : `<p class="st-empty st-empty--pad">Waiting for first AI message…</p>`}
    </div>`;
}

// ─── Drawer tab builders ──────────────────────────────────────────────────────
// Same data as the floating widget, laid out as a full list (no tabs) since
// the sidebar has height to spare instead of width.

function buildDrawerCharCard(name, fields, isCardCollapsed) {
  const [h, s, l] = getMoodHsl(fields.mood || "");
  const keys = CHAR_FIELDS.filter(k => k in fields);
  const extra = Object.keys(fields).filter(k => !CHAR_FIELDS.includes(k));
  const rows = [...keys, ...extra].map(key => `
    <div class="st-char-row">
      ${icon(key)}
      <div class="st-char-text">
        <span class="st-char-label">${key}</span>
        <span class="st-char-value">${escHtml(fields[key] || "—")}</span>
      </div>
    </div>`).join("");

  const chevron = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  const collapsedPreview = `
    <div class="st-drawer-preview">
      ${icon("position")}<span class="st-scene-value">${escHtml(fields.position || "—")}</span>
    </div>`;

  return `
    <div class="st-drawer-card ${isCardCollapsed ? "st-drawer-card--collapsed" : ""}" style="--st-mood-h:${h}; --st-mood-s:${s}%; --st-mood-l:${l}%;" data-char="${escAttr(name)}">
      <div class="st-drawer-card-header">
        <span class="st-drawer-card-name">${escHtml(name)}</span>
        <div class="st-drawer-card-actions">
          <button class="st-drawer-chevron" data-collapse-toggle="${escAttr(name)}" aria-label="Toggle details">${chevron}</button>
          <span class="st-tab-close" data-remove="${escAttr(name)}">×</span>
        </div>
      </div>
      ${isCardCollapsed
        ? collapsedPreview
        : `<div class="st-char-section st-drawer-char-section">${rows || `<p class="st-empty">No data yet.</p>`}</div>`}
    </div>`;
}

function buildDrawerTab(state, collapsedChars) {
  const scene      = state.scene || {};
  const characters = state.characters || {};
  const charNames  = Object.keys(characters);
  const allCollapsed = charNames.length > 0 && charNames.every(n => collapsedChars.has(n));

  const toggleAllRow = charNames.length > 1 ? `
    <div class="st-drawer-toggle-row">
      <button class="st-drawer-toggle-all" id="st-drawer-toggle-all">
        ${allCollapsed ? "Expand all" : "Collapse all"}
      </button>
    </div>` : "";

  return `
    <div class="st-drawer">
      <div class="st-scene-section st-drawer-scene">
        <div class="st-scene-row st-scene-row--inline">
          ${icon("date")}<span class="st-scene-value">${escHtml(scene.date || "—")}</span>
          <span class="st-scene-divider">·</span>
          ${icon("time")}<span class="st-scene-value">${escHtml(scene.time || "—")}</span>
        </div>
        ${buildSceneRow("weather", scene.weather)}
      </div>

      ${charNames.length
        ? `${toggleAllRow}<div class="st-drawer-list">${charNames.map(name => buildDrawerCharCard(name, characters[name], collapsedChars.has(name))).join("")}</div>`
        : `<p class="st-empty st-empty--pad">Waiting for first AI message…</p>`}
    </div>`;
}

// ─── Mood theming ─────────────────────────────────────────────────────────────

function applyMoodTheme(widgetRoot, mood) {
  const [h, s, l] = getMoodHsl(mood);
  const header = widgetRoot.querySelector("#st-header");
  const card   = widgetRoot.querySelector(".st-card");
  const pill   = widgetRoot.querySelector(".st-pill");
  if (header) {
    header.style.background   = `hsla(${h},${s}%,${l}%,0.18)`;
    header.style.borderBottom = `1px solid hsla(${h},${s}%,${l}%,0.2)`;
  }
  if (card) {
    card.style.borderColor = `hsla(${h},${s}%,${l}%,0.3)`;
    card.style.setProperty("--st-mood-h", h);
    card.style.setProperty("--st-mood-s", s + "%");
    card.style.setProperty("--st-mood-l", l + "%");
  }
  if (pill) {
    pill.style.borderColor = `hsla(${h},${s}%,${l}%,0.35)`;
    pill.style.color       = `hsla(${h},${s}%,${l + 20}%,0.85)`;
    pill.style.boxShadow   = `0 4px 20px rgba(0,0,0,0.55), 0 0 0 1px hsla(${h},${s}%,${l}%,0.15)`;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  scene-state { display: none !important; }

  .st-card {
    width: 300px;
    font-family: var(--lumiverse-font, system-ui, sans-serif);
    background: rgba(14, 11, 30, 0.88);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    overflow: hidden;
    backdrop-filter: blur(24px) saturate(150%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
    box-shadow: 0 2px 0 rgba(255,255,255,0.04) inset, 0 12px 40px rgba(0,0,0,0.6);
    transition: border-color 1s ease, box-shadow 1s ease;
    --st-mood-h: 258; --st-mood-s: 70%; --st-mood-l: 55%;
  }

  /* ── Header ── */
  .st-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 10px 9px 13px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    transition: background 1s ease, border-color 1s ease;
  }
  .st-title {
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
  }
  .st-collapse-btn {
    width: 24px; height: 24px; border-radius: 6px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.35); cursor: pointer; padding: 4px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s, color 0.12s;
  }
  .st-collapse-btn:hover { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8); }
  .st-collapse-btn svg { width: 12px; height: 12px; }

  /* ── Scene rows (time + weather) ── */
  .st-scene-section {
    display: flex; flex-direction: column; gap: 0;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.055);
  }
  .st-scene-row {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 0;
  }
  .st-scene-value {
    font-size: 12.5px; font-weight: 500;
    color: rgba(255,255,255,0.78);
    line-height: 1.3; word-break: break-word;
  }

  /* ── Icons ── */
  .st-icon {
    flex-shrink: 0;
    width: 14px; height: 14px;
    color: hsla(var(--st-mood-h), var(--st-mood-s), var(--st-mood-l), 0.75);
    display: flex; align-items: center; justify-content: center;
    transition: color 1s ease;
  }
  .st-icon svg { width: 14px; height: 14px; }

  /* ── Tab bar ── */
  .st-tab-bar {
    display: flex; flex-wrap: wrap; gap: 4px;
    padding: 8px 12px 7px;
    border-bottom: 1px solid rgba(255,255,255,0.055);
  }
  .st-tab {
    display: flex; align-items: center; gap: 3px;
    padding: 3px 8px 3px 9px;
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    font-family: inherit; font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.38); cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    white-space: nowrap;
  }
  .st-tab:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.7); }
  .st-tab--active {
    background: hsla(var(--st-mood-h), var(--st-mood-s), var(--st-mood-l), 0.18);
    border-color: hsla(var(--st-mood-h), var(--st-mood-s), var(--st-mood-l), 0.35);
    color: rgba(255,255,255,0.9);
  }
  .st-tab-name { pointer-events: none; }
  .st-tab-close {
    font-size: 13px; line-height: 1;
    color: rgba(255,255,255,0.18); padding: 0 1px;
    transition: color 0.12s;
  }
  .st-tab-close:hover { color: rgba(255,100,100,0.8); }

  /* ── Character section ── */
  .st-char-section {
    padding: 8px 12px 10px;
    display: flex; flex-direction: column; gap: 0;
    animation: st-fade-in 0.18s ease-out;
  }
  @keyframes st-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .st-char-row {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255,255,255,0.045);
  }
  .st-char-row:last-child { border-bottom: none; }
  .st-char-row .st-icon { margin-top: 3px; }
  .st-char-text {
    display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0;
  }
  .st-char-label {
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }
  .st-char-value {
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.9);
    line-height: 1.35; word-break: break-word;
  }

  /* ── Empty state ── */
  .st-empty {
    font-size: 11.5px; color: rgba(255,255,255,0.28);
    font-style: italic; margin: 0;
  }
  .st-empty--pad { padding: 10px 13px; }

  /* ── Collapsed pill ── */
  .st-pill {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 14px 8px 11px;
    background: rgba(14,11,30,0.88);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 999px; color: rgba(255,255,255,0.55);
    cursor: pointer; font-family: inherit;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(0,0,0,0.55);
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .st-pill svg { width: 13px; height: 13px; flex-shrink: 0; }
  .st-pill:hover { background: rgba(28,20,52,0.95); color: rgba(255,255,255,0.9); }

  /* Inline style */
  .st-scene-row--inline {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .st-scene-divider {
    opacity: 0.3;
    font-size: 11px;
    margin: 0 2px; }

  /* ── Flash ── */
  @keyframes st-pulse {
    0%   { box-shadow: 0 0 0 0 hsla(var(--st-mood-h),var(--st-mood-s),var(--st-mood-l),0.55), 0 12px 40px rgba(0,0,0,0.6); }
    60%  { box-shadow: 0 0 0 6px hsla(var(--st-mood-h),var(--st-mood-s),var(--st-mood-l),0), 0 12px 40px rgba(0,0,0,0.6); }
    100% { box-shadow: 0 12px 40px rgba(0,0,0,0.6); }
  }
  .st-card.st-flash { animation: st-pulse 0.7s ease-out forwards; }

  @keyframes st-pill-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(124,77,255,0.65), 0 4px 20px rgba(0,0,0,0.55); }
    60%  { box-shadow: 0 0 0 6px rgba(124,77,255,0),  0 4px 20px rgba(0,0,0,0.55); }
    100% { box-shadow: 0 4px 20px rgba(0,0,0,0.55); }
  }
  .st-pill.st-flash { animation: st-pill-pulse 0.7s ease-out forwards; }

  /* ── Drawer tab ── */
  .st-drawer {
    font-family: var(--lumiverse-font, system-ui, sans-serif);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .st-drawer-scene {
    border-bottom: none;
    padding: 0 2px 10px;
    border-bottom: 1px solid var(--lumiverse-border, rgba(127,127,127,0.15));
  }
  .st-drawer-scene .st-scene-value {
    color: var(--lumiverse-text, inherit);
    opacity: 0.85;
  }
  .st-drawer-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .st-drawer-card {
    border-left: 3px solid hsla(var(--st-mood-h), var(--st-mood-s), var(--st-mood-l), 0.7);
    background: hsla(var(--st-mood-h), var(--st-mood-s), var(--st-mood-l), 0.1);
    border-radius: 8px;
    padding: 10px 12px;
    transition: background 0.2s ease;
  }
  .st-drawer-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }
  .st-drawer-card-name {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--lumiverse-text, inherit);
  }
  .st-drawer-char-section {
    padding: 4px 0 0;
  }
  .st-drawer-char-section .st-char-row {
    border-bottom: 1px solid var(--lumiverse-border, rgba(127,127,127,0.08));
  }
  .st-drawer-char-section .st-char-label {
    color: var(--lumiverse-text-dim, rgba(127,127,127,0.6));
  }
  .st-drawer-char-section .st-char-value {
    color: var(--lumiverse-text, inherit);
    opacity: 0.9;
  }
  .st-drawer-char-section .st-icon {
    opacity: 0.8;
  }
  .st-drawer-card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .st-drawer-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--lumiverse-text-dim, rgba(127,127,127,0.6));
    cursor: pointer;
    transition: transform 0.15s ease, color 0.12s;
  }
  .st-drawer-chevron svg {
    width: 14px;
    height: 14px;
  }
  .st-drawer-chevron:hover {
    color: var(--lumiverse-text, inherit);
  }
  .st-drawer-card--collapsed .st-drawer-chevron {
    transform: rotate(-90deg);
  }
  .st-drawer-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0 2px;
  }
  .st-drawer-preview .st-scene-value {
    color: var(--lumiverse-text, inherit);
    opacity: 0.85;
    font-size: 12.5px;
  }
  .st-drawer-toggle-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  .st-drawer-toggle-all {
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--lumiverse-text-dim, rgba(127,127,127,0.6));
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    transition: color 0.12s;
  }
  .st-drawer-toggle-all:hover {
    color: var(--lumiverse-text, inherit);
  }
`;

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setup(ctx) {
  let state       = { scene: {}, characters: {} };
  let activeTab   = null;
  let isCollapsed    = false;
  let latestMsgId    = null;   // only process tags from the most recent message

  const removeStyle = ctx.dom.addStyle(STYLES);

  const POSITION_KEY = "scene_tracker_position";
  let savedPos = { x: window.innerWidth - 320, y: 100 };
  try {
    const stored = localStorage.getItem(POSITION_KEY);
    if (stored) savedPos = JSON.parse(stored);
  } catch {}

  const COLLAPSED_KEY = "scene_tracker_collapsed_chars";
  let collapsedChars = new Set();
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored) collapsedChars = new Set(JSON.parse(stored));
  } catch {}
  function saveCollapsedChars() {
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsedChars])); } catch {}
  }

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

  // ── Drawer tab (sidebar) ─────────────────────────────────────────────────────
  // Same state, same icons/colors — just a full-list layout instead of tabs,
  // since the sidebar has room for everyone at once.
  const drawerTab = ctx.ui.registerDrawerTab({
    id: "tracker",
    title: "Scene Tracker",
    shortName: "Track",
    description: "Track scene state and characters across the session",
    keywords: ["scene", "character", "mood", "tracker"],
    headerTitle: "Scene Tracker",
    iconSvg: ICONS.location,
  });

  // Track which message is the latest so scroll renders don't trigger updates
  const unsubGenEnded = ctx.events.on("GENERATION_ENDED", (payload) => {
    if (payload.messageId) latestMsgId = payload.messageId;
  });

  // ── Repaint ──────────────────────────────────────────────────────────────────

  function repaint() {
    const charNames = Object.keys(state.characters || {});
    if (activeTab && !charNames.includes(activeTab)) activeTab = charNames[0] ?? null;
    if (!activeTab && charNames.length) activeTab = charNames[0];

    widgetRoot.innerHTML = buildWidget(state, activeTab, isCollapsed);

    const mood = activeTab ? (state.characters[activeTab] || {}).mood || "" : "";
    applyMoodTheme(widgetRoot, mood);

    widgetRoot.querySelector("#st-expand")?.addEventListener("click", () => {
      isCollapsed = false; repaint();
    });
    widgetRoot.querySelector("#st-collapse")?.addEventListener("click", () => {
      isCollapsed = true; repaint();
    });

    widgetRoot.querySelectorAll(".st-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        if (e.target.closest(".st-tab-close")) return;
        activeTab = tab.dataset.tab; repaint();
      });
    });

    widgetRoot.querySelectorAll(".st-tab-close").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = btn.dataset.remove;
        delete state.characters[name];
        if (activeTab === name) activeTab = null;
        collapsedChars.delete(name);
        saveCollapsedChars();
        ctx.sendToBackend({ type: "remove_character", name });
        repaint();
      });
    });

    // Drawer tab gets the same data, different layout — no tabs to manage,
    // just every character's card and a remove button on each.
    drawerTab.root.innerHTML = buildDrawerTab(state, collapsedChars);
    drawerTab.root.querySelectorAll(".st-tab-close").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = btn.dataset.remove;
        delete state.characters[name];
        if (activeTab === name) activeTab = null;
        collapsedChars.delete(name);
        saveCollapsedChars();
        ctx.sendToBackend({ type: "remove_character", name });
        repaint();
      });
    });
    drawerTab.root.querySelectorAll(".st-drawer-chevron").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = btn.dataset.collapseToggle;
        if (collapsedChars.has(name)) collapsedChars.delete(name);
        else collapsedChars.add(name);
        saveCollapsedChars();
        repaint();
      });
    });
    drawerTab.root.querySelector("#st-drawer-toggle-all")?.addEventListener("click", () => {
      const charNames = Object.keys(state.characters || {});
      const allCollapsed = charNames.length > 0 && charNames.every(n => collapsedChars.has(n));
      if (allCollapsed) {
        collapsedChars.clear();
      } else {
        charNames.forEach(n => collapsedChars.add(n));
      }
      saveCollapsedChars();
      repaint();
    });
  }

  // ── Flash ────────────────────────────────────────────────────────────────────

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

  const unsubTag = ctx.messages.registerTagInterceptor(
  { tagName: "scene-state", removeFromMessage: true },
  (payload) => {
    if (payload.isUser) return;

    // Only process the actively streaming/just-completed message
    if (
      !payload.isStreaming &&
      latestMsgId !== null &&
      payload.messageId !== latestMsgId
    ) return;

    // DON'T mutate state here — just forward to backend.
    // The backend will persist it and send back a state_updated,
    // which is the single place we update local state.
    try {
      const data = JSON.parse(payload.content || payload.innerText || "{}");
      ctx.sendToBackend({
        type: "tag_parsed",
        scene: data.scene || {},
        characters: data.characters || [],
      });
      isCollapsed ? flashPill() : flashCard();
    } catch (e) {
      ctx.log?.warn("[SceneTracker] Tag parse error: " + e.message);
    }
  }
);

  // ── Backend messages ─────────────────────────────────────────────────────────

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (payload.type === "state_updated") {
      state = payload.state ?? { scene: {}, characters: {} };
      repaint();
    } else if (payload.type === "state_reset") {
      // Chat closed or switched to home — clear everything
      state = { scene: {}, characters: {} };
      activeTab = null;
      repaint();
    }
  });

  // ── Listen for chat switches on the frontend too ─────────────────────────────
  // Backend will send state_updated for the new chat, but we clear immediately
  // so old tabs don't flash up before the new state arrives.
  const unsubChatSwitch = ctx.events.on("CHAT_SWITCHED", ({ chatId }) => {
    state = { scene: {}, characters: {} };
    activeTab = null;
    latestMsgId = null;
    repaint();
  });

  ctx.sendToBackend({ type: "request_state" });
  repaint();

  return () => {
    unsubTag();
    unsubBackend();
    unsubChatSwitch();
    unsubGenEnded();
    removeStyle();
    floatWidget.destroy();
    drawerTab.destroy();
  };
}
