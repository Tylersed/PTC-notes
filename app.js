/* ==========================================================
   PTC Notes Vault (Premium)
   - Local notes (browser storage)
   - Optional Vault encryption (AES-GCM via WebCrypto)
   - Tabs + Split view
   - Spotlight (notes + commands)
   - Rich editor: checklist, tables, code blocks, callouts, markdown paste
   - Clipboard Vault images: paste -> compress -> embed + gallery
   - Templates
   - Action Items: global tasks with due parsing
   - Version History + restore + simple diff
   - Dashboard + Timeline
   - Themes + accessibility
   - Export: Word (.doc), PDF, Read-only HTML
   - Export Redaction mode
   ========================================================== */
// 🔓 Login/Password bar DISABLED (always open)
document.addEventListener("DOMContentLoaded", () => {
  // Remove any lock/login UI if it exists
  [
    "#lockBar", "#loginBar", "#authBar",
    ".lockbar", ".loginbar", ".authbar",
    ".lock-bar", ".login-bar", ".auth-bar"
  ].forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));

  // Clear any "locked" state
  document.documentElement.classList.remove("locked");
  document.body.classList.remove("locked");

  // Force any localStorage unlock flags to true (covers different names)
  try {
    localStorage.setItem("ptcUnlocked", "1");
    localStorage.setItem("ptc_notes_unlocked", "1");
    localStorage.setItem("PTC_NOTES_UNLOCKED", "1");
  } catch (e) {}
});

(() => {
  "use strict";

  /* ------------------------ DOM helpers ------------------------ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ------------------------ Storage keys ------------------------ */
  const KEY_PLAIN = "ptc_notes_premium_v1";
  const KEY_VAULT = "ptc_notes_premium_vault_v1";
  const KEY_PREFS = "ptc_notes_premium_prefs_v1";

  /* ------------------------ UI elements ------------------------ */
  const elApp = $("#app");
  const elLock = $("#lock");
  const unlockPass = $("#unlockPass");
  const btnUnlock = $("#btnUnlock");
  const btnVaultWipe = $("#btnVaultWipe");

  const subline = $("#subline");

  const searchInput = $("#searchInput");
  const btnSpotlight = $("#btnSpotlight");
  const btnNew = $("#btnNew");
  const btnTemplate = $("#btnTemplate");
  const btnExport = $("#btnExport");
  const btnBackup = $("#btnBackup");
  const btnSplit = $("#btnSplit");
  const btnVault = $("#btnVault");
  const btnSettings = $("#btnSettings");

  const navNotes = $("#navNotes");
  const navDashboard = $("#navDashboard");
  const navTasks = $("#navTasks");
  const navTimeline = $("#navTimeline");

  const viewNotes = $("#viewNotes");
  const viewDashboard = $("#viewDashboard");
  const viewTasks = $("#viewTasks");
  const viewTimeline = $("#viewTimeline");

  const chipAll = $("#chipAll");
  const chipPinned = $("#chipPinned");
  const chipRecent = $("#chipRecent");

  const noteList = $("#noteList");
  const noteCount = $("#noteCount");

  const tabsLeft = $("#tabsLeft");
  const tabsRight = $("#tabsRight");
  const tabsDivider = $("#tabsDivider");

  const panes = $("#panes");
  const paneLeft = $("#paneLeft");
  const paneRight = $("#paneRight");

  // Pane L elements
  const titleL = $("#titleInputL");
  const editorL = $("#editorBodyL");
  const paperL = $("#paperL");
  const phL = $("#bodyPlaceholderL");
  const statusL = $("#metaStatusL");
  const updatedL = $("#metaUpdatedL");
  const tagRowL = $("#tagRowL");
  const tagInputL = $("#tagInputL");
  const tagSuggestL = $("#tagSuggestL");

  // Pane R elements
  const titleR = $("#titleInputR");
  const editorR = $("#editorBodyR");
  const paperR = $("#paperR");
  const phR = $("#bodyPlaceholderR");
  const statusR = $("#metaStatusR");
  const updatedR = $("#metaUpdatedR");
  const tagRowR = $("#tagRowR");
  const tagInputR = $("#tagInputR");
  const tagSuggestR = $("#tagSuggestR");

  // Dashboard
  const dashPinned = $("#dashPinned");
  const dashRecent = $("#dashRecent");
  const dashTags = $("#dashTags");

  // Tasks
  const taskSearch = $("#taskSearch");
  const taskFilter = $("#taskFilter");
  const btnTaskRefresh = $("#btnTaskRefresh");
  const taskList = $("#taskList");

  // Timeline
  const timeline = $("#timeline");

  // Spotlight
  const overlay = $("#overlay");
  const palInput = $("#palInput");
  const palList = $("#palList");
  const palTabAll = $("#palTabAll");
  const palTabNotes = $("#palTabNotes");
  const palTabCmds = $("#palTabCmds");

  // Modal
  const modal = $("#modal");
  const modalCard = $("#modalCard");

  // Import
  const importFile = $("#importFile");

  // Toasts
  const toasts = $("#toasts");

  /* ------------------------ State ------------------------ */
  let prefs = {
    theme: "executive",      // executive | minimal | highContrast
    glow: 1,                // 0.6 - 1.2
    contrast: 1,            // 1 - 1.15
    powerMode: true,        // extra keyboard shortcuts
    redactOnExport: false,  // mask emails/phones on export
    autoLockMins: 10,       // vault auto-lock after inactivity
    markdownPaste: true,    // convert markdown on paste
    snapMins: 2             // history snapshots interval
  };

  let vault = {
    enabled: false,
    locked: false,
    saltB64: null,
    ivB64: null,
    cipherB64: null
  };

  let state = {
    notes: [],
    activeTabs: {
      L: [], // array of noteIds
      R: []
    },
    activeId: { L: null, R: null },
    split: false,
    filter: "all",
    query: "",
    view: "notes",
    activity: [] // timeline events
  };

  let lastInteraction = Date.now();
  let saveTimer = null;

  /* ------------------------ Utilities ------------------------ */
  const isMac = () => navigator.platform.toLowerCase().includes("mac");
  const modKey = (e) => isMac() ? e.metaKey : e.ctrlKey;

  const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
  const nowISO = () => new Date().toISOString();

  const escapeHTML = (s) => (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function stripHTML(html){
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return (div.textContent || div.innerText || "").trim();
  }

  function relTime(iso){
    if(!iso) return "—";
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const s = Math.floor(diff/1000);
    if(s < 10) return "just now";
    if(s < 60) return `${s}s ago`;
    const m = Math.floor(s/60);
    if(m < 60) return `${m}m ago`;
    const h = Math.floor(m/60);
    if(h < 24) return `${h}h ago`;
    const d = Math.floor(h/24);
    return `${d}d ago`;
  }

  function toast(title, desc="", kind="ok"){
    const wrap = document.createElement("div");
    wrap.className = "toast";
    wrap.innerHTML = `
      <div class="toast__dot ${kind}"></div>
      <div>
        <div class="toast__t">${escapeHTML(title)}</div>
        <div class="toast__d">${escapeHTML(desc)}</div>
      </div>
    `;
    toasts.appendChild(wrap);

    setTimeout(() => {
      wrap.animate(
        [{opacity:1, transform:"translate3d(0,0,0)"},{opacity:0, transform:"translate3d(0,10px,0)"}],
        {duration: 180, easing:"cubic-bezier(.2,.9,.2,1)"}
      ).onfinish = () => wrap.remove();
    }, 2800);
  }

  function logEvent(type, noteId, meta={}){
    state.activity.unshift({
      id: uid(),
      ts: nowISO(),
      type,
      noteId,
      meta
    });
    // cap
    if(state.activity.length > 200) state.activity.length = 200;
  }

  function setTheme(){
    const root = document.documentElement;
    if(prefs.theme === "executive"){
      root.style.setProperty("--glowStrength", String(prefs.glow));
      root.style.setProperty("--contrast", String(prefs.contrast));
    } else if(prefs.theme === "minimal"){
      root.style.setProperty("--glowStrength", String(Math.max(0.55, prefs.glow - 0.35)));
      root.style.setProperty("--contrast", String(prefs.contrast));
    } else if(prefs.theme === "highContrast"){
      root.style.setProperty("--glowStrength", String(Math.max(0.65, prefs.glow)));
      root.style.setProperty("--contrast", String(Math.max(1.08, prefs.contrast)));
    }
  }

  function loadPrefs(){
    try{
      const raw = localStorage.getItem(KEY_PREFS);
      if(raw){
        const obj = JSON.parse(raw);
        prefs = { ...prefs, ...obj };
      }
    }catch{}
    setTheme();
  }

  function savePrefs(){
    localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
    setTheme();
  }

  /* ------------------------ Note model ------------------------ */
  function makeNote({title="Untitled note", html="", tags=[], pinned=false}={}){
    const id = uid();
    return {
      id,
      title,
      html,
      tags,
      pinned,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      history: [],   // snapshots
      tasks: []      // inline tasks can be derived; keep optional per note
    };
  }

  function seedFirstRun(){
    const first = makeNote({
      title: "Welcome to PTC Notes Vault",
      pinned: true,
      tags: ["ptc","vault"],
      html: `
        <h2>Premium, local-only notes</h2>
        <p>This app saves your notes <strong>in this browser</strong> automatically.</p>
        <div class="callout" data-kind="info">
          <strong>Pro tip:</strong> Use <em>Backup</em> to export JSON, and use <em>Export</em> for Word/PDF/HTML.
        </div>
        <h2>Shortcuts</h2>
        <ul>
          <li><strong>Ctrl/Cmd + K</strong> Spotlight</li>
          <li><strong>Ctrl/Cmd + N</strong> New note</li>
          <li><strong>Ctrl/Cmd + /</strong> Templates</li>
          <li><strong>Ctrl/Cmd + \\</strong> Toggle split view</li>
        </ul>
        <h2>Action Items</h2>
        <div class="checkline"><input type="checkbox" /> <div>Try creating a meeting minutes note using templates.</div></div>
        <div class="checkline"><input type="checkbox" /> <div>Paste an image — it compresses and stores locally.</div></div>
      `
    });

    const minutes = makeNoteFromTemplate("Meeting Minutes");
    minutes.pinned = true;

    state.notes = [first, minutes];
    // tabs
    state.activeTabs.L = [first.id, minutes.id];
    state.activeId.L = minutes.id;
  }

  /* ------------------------ Templates ------------------------ */
  const templates = {
    "Meeting Minutes": ({today}) => `
      <h2>Meeting Minutes</h2>
      <div class="callout" data-kind="info"><strong>Date:</strong> ${escapeHTML(today)} • <strong>Owner:</strong> Tyler</div>
      <h2>Attendees</h2>
      <ul><li></li></ul>
      <h2>Agenda</h2>
      <ol><li></li></ol>
      <h2>Notes</h2>
      <p></p>
      <h2>Decisions</h2>
      <ul><li></li></ul>
      <h2>Action Items</h2>
      <div class="checkline"><input type="checkbox" /> <div>Action: … <span style="opacity:.65">(due: 2026-02-25)</span></div></div>
    `,
    "Incident Notes": ({today}) => `
      <h2>Security Incident Notes</h2>
      <div class="callout" data-kind="warn"><strong>Date:</strong> ${escapeHTML(today)} • <strong>Severity:</strong> TBD</div>
      <h2>Executive Summary</h2>
      <p></p>
      <h2>Timeline</h2>
      <table>
        <tr><th>Time</th><th>Event</th><th>Owner</th></tr>
        <tr><td></td><td></td><td></td></tr>
      </table>
      <h2>Indicators</h2>
      <ul><li></li></ul>
      <h2>Actions Taken</h2>
      <div class="checkline"><input type="checkbox" /> <div>Action: …</div></div>
      <h2>Next Steps</h2>
      <ul><li></li></ul>
    `,
    "Vendor Review": ({today}) => `
      <h2>Vendor Review</h2>
      <div class="callout" data-kind="info"><strong>Date:</strong> ${escapeHTML(today)}</div>
      <h2>Vendor</h2>
      <p></p>
      <h2>Scope</h2>
      <ul><li></li></ul>
      <h2>Security</h2>
      <ul><li></li></ul>
      <h2>Gaps / Risks</h2>
      <div class="callout" data-kind="danger"><strong>Risk:</strong> </div>
      <h2>Recommendation</h2>
      <p></p>
      <h2>Action Items</h2>
      <div class="checkline"><input type="checkbox" /> <div>Action: …</div></div>
    `,
    "Daily Log": ({today}) => `
      <h2>Daily Log</h2>
      <div class="callout" data-kind="ok"><strong>Date:</strong> ${escapeHTML(today)}</div>
      <h2>Top Priorities</h2>
      <div class="checkline"><input type="checkbox" /> <div>Action: …</div></div>
      <div class="checkline"><input type="checkbox" /> <div>Action: …</div></div>
      <h2>Notes</h2>
      <ul><li></li></ul>
      <h2>Follow Ups</h2>
      <ul><li></li></ul>
    `,
    "Client Onboarding": ({today}) => `
      <h2>Client Onboarding</h2>
      <div class="callout" data-kind="info"><strong>Date:</strong> ${escapeHTML(today)}</div>
      <h2>Client</h2>
      <p></p>
      <h2>Goals</h2>
      <ul><li></li></ul>
      <h2>Deliverables</h2>
      <ul><li></li></ul>
      <h2>Action Items</h2>
      <div class="checkline"><input type="checkbox" /> <div>Action: …</div></div>
    `
  };

  function makeNoteFromTemplate(name){
    const today = new Date().toLocaleDateString();
    const html = templates[name] ? templates[name]({today}) : "<p></p>";
    const n = makeNote({ title: name, html, tags: ["template"] });
    return n;
  }

  /* ------------------------ Filters & sorting ------------------------ */
  function sortNotes(list){
    return [...list].sort((a,b) => {
      if(!!b.pinned !== !!a.pinned) return (b.pinned?1:0) - (a.pinned?1:0);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  function applyFilters(){
    let notes = state.notes;

    const q = state.query.trim().toLowerCase();
    if(q){
      notes = notes.filter(n => {
        const hay = [n.title, stripHTML(n.html), (n.tags||[]).join(" ")].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    if(state.filter === "pinned") notes = notes.filter(n => n.pinned);
    if(state.filter === "recent"){
      const cutoff = Date.now() - (7*24*60*60*1000);
      notes = notes.filter(n => new Date(n.updatedAt).getTime() >= cutoff);
    }

    return sortNotes(notes);
  }

  function getNote(id){
    return state.notes.find(n => n.id === id) || null;
  }

  function activeNote(pane){
    return getNote(state.activeId[pane]);
  }

  /* ------------------------ Vault crypto ------------------------ */
  function b64FromBytes(bytes){
    let s = "";
    bytes.forEach(b => s += String.fromCharCode(b));
    return btoa(s);
  }
  function bytesFromB64(b64){
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function deriveKey(password, saltBytes){
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: saltBytes, iterations: 120000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt","decrypt"]
    );
  }

  async function vaultEncrypt(password, plaintext){
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();
    const cipher = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, enc.encode(plaintext));
    return {
      saltB64: b64FromBytes(salt),
      ivB64: b64FromBytes(iv),
      cipherB64: b64FromBytes(new Uint8Array(cipher))
    };
  }

  async function vaultDecrypt(password, saltB64, ivB64, cipherB64){
    const salt = bytesFromB64(saltB64);
    const iv = bytesFromB64(ivB64);
    const cipherBytes = bytesFromB64(cipherB64);
    const key = await deriveKey(password, salt);
    const plainBuf = await crypto.subtle.decrypt({name:"AES-GCM", iv}, key, cipherBytes);
    return new TextDecoder().decode(plainBuf);
  }

  function loadVaultMeta(){
    try{
      const raw = localStorage.getItem(KEY_VAULT);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch{
      return null;
    }
  }

  function saveVaultMeta(meta){
    localStorage.setItem(KEY_VAULT, JSON.stringify(meta));
  }

  function wipeVault(){
    localStorage.removeItem(KEY_VAULT);
    toast("Vault wiped", "Encrypted vault data removed from this browser.", "warn");
    // fall back to plain (fresh)
    vault.enabled = false;
    vault.locked = false;
    initPlainFresh();
  }

  async function enableVaultFlow(){
    const p1 = prompt("Set a Vault password (you must remember it):");
    if(!p1) return;
    const p2 = prompt("Confirm Vault password:");
    if(p2 !== p1){
      toast("Passwords did not match", "Vault not enabled.", "danger");
      return;
    }
    // encrypt current payload
    const payload = JSON.stringify(state);
    const out = await vaultEncrypt(p1, payload);
    vault.enabled = true;
    vault.locked = false;
    vault.saltB64 = out.saltB64;
    vault.ivB64 = out.ivB64;
    vault.cipherB64 = out.cipherB64;

    saveVaultMeta({ enabled:true, ...out });

    // remove plain for privacy
    localStorage.removeItem(KEY_PLAIN);
    toast("Vault enabled", "Data is encrypted in this browser.");
    setSubline();
  }

  async function lockVault(){
    if(!vault.enabled) return;
    vault.locked = true;
    // clear memory
    state.notes = [];
    state.activeTabs = {L:[],R:[]};
    state.activeId = {L:null,R:null};
    state.activity = [];
    elApp.hidden = true;
    elLock.hidden = false;
    unlockPass.value = "";
    unlockPass.focus();
    setSubline();
  }

  async function unlockVaultFlow(password){
    const meta = loadVaultMeta();
    if(!meta?.enabled || !meta.saltB64 || !meta.ivB64 || !meta.cipherB64){
      toast("No vault found", "Vault data is missing.", "danger");
      return;
    }
    try{
      const plain = await vaultDecrypt(password, meta.saltB64, meta.ivB64, meta.cipherB64);
      const obj = JSON.parse(plain);

      // restore
      state = normalizeState(obj);
      vault.enabled = true;
      vault.locked = false;
      vault.saltB64 = meta.saltB64;
      vault.ivB64 = meta.ivB64;
      vault.cipherB64 = meta.cipherB64;

      elLock.hidden = true;
      elApp.hidden = false;

      toast("Unlocked", "Vault unlocked successfully.");
      setSubline();
      renderAll();
    }catch(e){
      toast("Unlock failed", "Incorrect password or corrupted vault.", "danger");
    }
  }

  async function persistVault(passwordCache){
    if(!vault.enabled || vault.locked) return;

    // If we don't have a cached password, we can’t re-encrypt
    // We keep a short-lived in-memory password cache while unlocked.
    if(!passwordCache?.value) return;

    const payload = JSON.stringify(state);
    const out = await vaultEncrypt(passwordCache.value, payload);

    vault.saltB64 = out.saltB64;
    vault.ivB64 = out.ivB64;
    vault.cipherB64 = out.cipherB64;

    saveVaultMeta({ enabled:true, ...out });
  }

  let vaultPassCache = { value: null }; // in-memory only

  /* ------------------------ Persistence (plain + vault) ------------------------ */
  function normalizeState(obj){
    const s = obj && typeof obj === "object" ? obj : {};
    const notes = Array.isArray(s.notes) ? s.notes : [];
    // ensure fields exist
    notes.forEach(n => {
      n.tags = Array.isArray(n.tags) ? n.tags : [];
      n.history = Array.isArray(n.history) ? n.history : [];
      n.pinned = !!n.pinned;
      n.html = n.html ?? "";
      n.title = n.title ?? "Untitled note";
      n.createdAt = n.createdAt ?? nowISO();
      n.updatedAt = n.updatedAt ?? nowISO();
    });

    return {
      notes,
      activeTabs: s.activeTabs && typeof s.activeTabs === "object" ? {L: s.activeTabs.L||[], R: s.activeTabs.R||[]} : {L:[],R:[]},
      activeId: s.activeId && typeof s.activeId === "object" ? {L: s.activeId.L||null, R: s.activeId.R||null} : {L:null,R:null},
      split: !!s.split,
      filter: s.filter || "all",
      query: s.query || "",
      view: s.view || "notes",
      activity: Array.isArray(s.activity) ? s.activity : []
    };
  }

  function initPlainFresh(){
    state = normalizeState({});
    seedFirstRun();
    persistPlain(true);
    elLock.hidden = true;
    elApp.hidden = false;
    renderAll();
  }

  function loadPlain(){
    try{
      const raw = localStorage.getItem(KEY_PLAIN);
      if(!raw) return null;
      return normalizeState(JSON.parse(raw));
    }catch{
      return null;
    }
  }

  function persistPlain(silent=false){
    localStorage.setItem(KEY_PLAIN, JSON.stringify(state));
    if(!silent) toast("Saved", "Stored locally in this browser.");
  }

  function schedulePersist(){
    clearTimeout(saveTimer);
    setStatus("Saving…", "warn");
    saveTimer = setTimeout(async () => {
      // history snapshots
      snapshotIfNeeded("L");
      snapshotIfNeeded("R");

      if(vault.enabled){
        await persistVault(vaultPassCache);
      } else {
        persistPlain(true);
      }
      setStatus("Saved", "ok");
      renderMeta("L");
      renderMeta("R");
      renderDashboard();
      renderTimeline();
    }, 450);
  }

  function setSubline(){
    if(vault.enabled){
      subline.textContent = vault.locked ? "Vault locked • Enter password to unlock" : "Vault enabled • Encrypted locally (AES-GCM)";
    }else{
      subline.textContent = "Saved locally in this browser • Backup recommended";
    }
  }

  /* ------------------------ View switching ------------------------ */
  function setView(v){
    state.view = v;
    [navNotes, navDashboard, navTasks, navTimeline].forEach(x => x.classList.remove("is-active"));
    [viewNotes, viewDashboard, viewTasks, viewTimeline].forEach(x => x.hidden = true);

    if(v === "notes"){ navNotes.classList.add("is-active"); viewNotes.hidden = false; }
    if(v === "dashboard"){ navDashboard.classList.add("is-active"); viewDashboard.hidden = false; renderDashboard(); }
    if(v === "tasks"){ navTasks.classList.add("is-active"); viewTasks.hidden = false; renderTasks(); }
    if(v === "timeline"){ navTimeline.classList.add("is-active"); viewTimeline.hidden = false; renderTimeline(); }

    schedulePersist();
  }

  /* ------------------------ Tabs + split ------------------------ */
  function openInPane(pane, noteId){
    if(!noteId) return;
    // ensure in tabs
    const group = state.activeTabs[pane];
    if(!group.includes(noteId)) group.unshift(noteId);
    state.activeId[pane] = noteId;

    // cap tabs
    if(group.length > 10) group.length = 10;

    renderTabs();
    renderPane(pane, true);
    renderList();
    schedulePersist();
  }

  function closeTab(pane, noteId){
    const group = state.activeTabs[pane];
    const idx = group.indexOf(noteId);
    if(idx >= 0) group.splice(idx,1);

    if(state.activeId[pane] === noteId){
      state.activeId[pane] = group[0] || null;
    }
    renderTabs();
    renderPane(pane, true);
    schedulePersist();
  }

  function toggleSplit(){
    state.split = !state.split;
    panes.classList.toggle("is-split", state.split);
    paneRight.hidden = !state.split;
    tabsRight.hidden = !state.split;
    tabsDivider.hidden = !state.split;

    if(state.split){
      // choose a different note for right pane if empty
      if(!state.activeId.R){
        const alt = state.notes.find(n => n.id !== state.activeId.L);
        if(alt){
          state.activeTabs.R = [alt.id];
          state.activeId.R = alt.id;
        }
      }
    }
    renderTabs();
    renderPane("L", true);
    renderPane("R", true);
    schedulePersist();
    toast("Split view", state.split ? "Enabled" : "Disabled");
  }

  /* Drag reorder tabs */
  function bindTabDrag(el, pane, noteId){
    el.draggable = true;
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({pane, noteId}));
    });
    el.addEventListener("dragover", (e) => e.preventDefault());
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      try{
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if(data.pane !== pane) return;
        const group = state.activeTabs[pane];
        const from = group.indexOf(data.noteId);
        const to = group.indexOf(noteId);
        if(from < 0 || to < 0 || from === to) return;
        const [m] = group.splice(from,1);
        group.splice(to,0,m);
        renderTabs();
        schedulePersist();
      }catch{}
    });
  }

  function renderTabs(){
    const renderGroup = (pane, root) => {
      root.innerHTML = "";
      const group = state.activeTabs[pane] || [];
      group.forEach(id => {
        const n = getNote(id);
        if(!n) return;

        const el = document.createElement("div");
        el.className = "tab" + (state.activeId[pane] === id ? " is-active" : "");
        el.innerHTML = `
          ${n.pinned ? `<span class="pinDot" title="Pinned"></span>` : `<span style="width:8px;height:8px;"></span>`}
          <span class="tab__t">${escapeHTML(n.title || "Untitled")}</span>
          <button class="tab__x" title="Close tab">×</button>
        `;
        bindTabDrag(el, pane, id);

        on(el, "click", (ev) => {
          if(ev.target && ev.target.classList.contains("tab__x")) return;
          openInPane(pane, id);
        });
        on(el.querySelector(".tab__x"), "click", (ev) => {
          ev.stopPropagation();
          closeTab(pane, id);
        });

        root.appendChild(el);
      });
    };

    renderGroup("L", tabsLeft);
    renderGroup("R", tabsRight);
  }

  /* ------------------------ Note list ------------------------ */
  function renderList(){
    const list = applyFilters();
    noteCount.textContent = `${list.length} note${list.length===1?"":"s"}`;

    noteList.innerHTML = "";
    list.forEach(n => {
      const el = document.createElement("div");
      el.className = "note" + (n.id === state.activeId.L ? " is-active" : "");
      const snippet = stripHTML(n.html).slice(0, 120) || "No content yet…";
      const tags = (n.tags || []).slice(0, 3);

      el.innerHTML = `
        <div class="note__title">
          ${n.pinned ? `<span class="pinDot" title="Pinned"></span>` : ``}
          <span>${escapeHTML(n.title || "Untitled note")}</span>
        </div>
        <div class="note__snippet">${escapeHTML(snippet)}</div>
        <div class="note__foot">
          <div class="note__time">${escapeHTML(relTime(n.updatedAt))}</div>
          <div class="note__tags">${tags.map(t => `<span class="tagMini">${escapeHTML(t)}</span>`).join("")}</div>
        </div>
      `;

      on(el, "click", () => {
        openInPane("L", n.id);
      });

      on(el, "contextmenu", (e) => {
        e.preventDefault();
        // right click = open in right pane if split, otherwise toggle split then open
        if(!state.split){
          toggleSplit();
        }
        openInPane("R", n.id);
      });

      noteList.appendChild(el);
    });
  }

  /* ------------------------ Pane rendering ------------------------ */
  function setStatus(text, kind="ok", pane="L"){
    const el = pane === "L" ? statusL : statusR;
    el.textContent = text;
    if(kind === "ok") el.style.borderColor = "rgba(122,255,160,.25)";
    if(kind === "warn") el.style.borderColor = "rgba(255,206,102,.25)";
    if(kind === "danger") el.style.borderColor = "rgba(255,92,92,.25)";
  }

  function setEmpty(pane, empty){
    (pane === "L" ? paperL : paperR).classList.toggle("is-empty", !!empty);
  }

  function renderMeta(pane){
    const n = activeNote(pane);
    const el = pane === "L" ? updatedL : updatedR;
    el.textContent = n ? `Updated ${relTime(n.updatedAt)}` : "—";
  }

  function renderTags(pane){
    const n = activeNote(pane);
    const row = pane === "L" ? tagRowL : tagRowR;
    const suggest = pane === "L" ? tagSuggestL : tagSuggestR;

    row.innerHTML = "";
    suggest.innerHTML = "";

    if(!n) return;

    (n.tags || []).forEach(tag => {
      const pill = document.createElement("div");
      pill.className = "tag";
      pill.innerHTML = `<span>${escapeHTML(tag)}</span><button title="Remove tag">×</button>`;
      on(pill.querySelector("button"), "click", (e) => {
        e.stopPropagation();
        n.tags = n.tags.filter(t => t !== tag);
        n.updatedAt = nowISO();
        logEvent("tag-removed", n.id, {tag});
        schedulePersist();
        renderTags(pane);
        renderList();
      });
      row.appendChild(pill);
    });

    // Smart tag suggestions (offline)
    const suggestions = smartTagSuggestions(n).filter(t => !n.tags.includes(t)).slice(0, 10);
    suggestions.forEach(t => {
      const c = document.createElement("div");
      c.className = "suggestChip";
      c.textContent = `+ ${t}`;
      on(c, "click", () => {
        n.tags.push(t);
        n.updatedAt = nowISO();
        logEvent("tag-added", n.id, {tag:t});
        schedulePersist();
        renderTags(pane);
        renderList();
        toast("Tag added", t);
      });
      suggest.appendChild(c);
    });
  }

  function renderPane(pane, animate=false){
    const n = activeNote(pane);
    const title = pane === "L" ? titleL : titleR;
    const editor = pane === "L" ? editorL : editorR;

    if(!n){
      title.value = "";
      editor.innerHTML = "";
      renderTags(pane);
      setEmpty(pane, true);
      renderMeta(pane);
      return;
    }

    title.value = n.title || "";
    editor.innerHTML = n.html || "";
    setEmpty(pane, !stripHTML(n.html));
    renderTags(pane);
    renderMeta(pane);

    if(animate){
      editor.animate(
        [{opacity:0, transform:"translate3d(0,6px,0)"},{opacity:1, transform:"translate3d(0,0,0)"}],
        {duration: 220, easing: "cubic-bezier(.16,1,.3,1)"}
      );
    }
  }

  /* ------------------------ Editor sync + history snapshots ------------------------ */
  function snapshotIfNeeded(pane){
    const n = activeNote(pane);
    if(!n) return;

    const mins = Math.max(1, prefs.snapMins);
    const last = n.history.length ? n.history[n.history.length-1] : null;
    const lastTs = last ? new Date(last.ts).getTime() : 0;
    const due = Date.now() - lastTs >= mins*60*1000;

    // also only snapshot if content changed vs last snapshot
    const currentText = stripHTML(n.html);
    const lastText = last ? stripHTML(last.html) : "";
    const changed = currentText !== lastText;

    if(due && changed){
      n.history.push({ ts: nowISO(), title: n.title, html: n.html });
      if(n.history.length > 40) n.history.shift();
      logEvent("snapshot", n.id, {count:n.history.length});
    }
  }

  function syncFromUI(pane){
    const n = activeNote(pane);
    if(!n) return;

    const title = pane === "L" ? titleL : titleR;
    const editor = pane === "L" ? editorL : editorR;

    n.title = title.value.trim() || "Untitled note";
    n.html = editor.innerHTML;
    n.updatedAt = nowISO();

    setEmpty(pane, !stripHTML(n.html));
    renderMeta(pane);
    setStatus("Saving…", "warn", pane);

    logEvent("edit", n.id, {pane});
    schedulePersist();
    renderTabs();
    renderList();
  }

  /* ------------------------ Rich insert helpers ------------------------ */
  function execCmd(cmd, value=null){
    document.execCommand(cmd, false, value);
  }
  function wrapSelectionHTML(html){
    // insert HTML at cursor
    execCmd("insertHTML", html);
  }

  function insertChecklist(){
    wrapSelectionHTML(`<div class="checkline"><input type="checkbox" /> <div>Task… <span style="opacity:.65">(due: YYYY-MM-DD)</span></div></div>`);
  }
  function insertTable(){
    const r = Math.max(2, parseInt(prompt("Rows?", "3") || "3", 10));
    const c = Math.max(2, parseInt(prompt("Columns?", "3") || "3", 10));
    let html = `<table><tr>${Array.from({length:c}).map(()=>`<th></th>`).join("")}</tr>`;
    for(let i=0;i<r-1;i++){
      html += `<tr>${Array.from({length:c}).map(()=>`<td></td>`).join("")}</tr>`;
    }
    html += `</table>`;
    wrapSelectionHTML(html);
  }
  function insertCodeBlock(){
    wrapSelectionHTML(`<pre><code>// code…</code></pre>`);
  }
  function insertCallout(){
    const kind = (prompt("Callout type: info / warn / ok / danger", "info") || "info").toLowerCase();
    const safe = ["info","warn","ok","danger"].includes(kind) ? kind : "info";
    wrapSelectionHTML(`<div class="callout" data-kind="${safe}"><strong>${safe.toUpperCase()}:</strong> </div>`);
  }
  function insertLink(){
    const url = prompt("Paste a link URL:");
    if(!url) return;
    execCmd("createLink", url);
  }
  function clearFormatting(){
    execCmd("removeFormat");
    execCmd("unlink");
  }

  /* ------------------------ Markdown paste conversion ------------------------ */
  function mdToHTML(md){
    // A compact converter for common paste formats:
    // headings (#, ##), bullets (-), numbers (1.), code fences, bold/italic
    const lines = md.replace(/\r\n/g,"\n").split("\n");
    let html = "";
    let inCode = false;

    const inline = (s) => s
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>");

    for(let i=0;i<lines.length;i++){
      const line = lines[i];

      if(line.trim().startsWith("```")){
        if(!inCode){ inCode = true; html += `<pre><code>`; }
        else { inCode = false; html += `</code></pre>`; }
        continue;
      }
      if(inCode){
        html += inline(line).replaceAll("\n","") + "\n";
        continue;
      }

      if(/^##\s+/.test(line)){
        html += `<h2>${inline(line.replace(/^##\s+/,""))}</h2>`;
        continue;
      }
      if(/^#\s+/.test(line)){
        html += `<h2>${inline(line.replace(/^#\s+/,""))}</h2>`;
        continue;
      }

      if(/^\s*-\s+/.test(line)){
        // collect list
        const items = [];
        while(i < lines.length && /^\s*-\s+/.test(lines[i])){
          items.push(`<li>${inline(lines[i].replace(/^\s*-\s+/,""))}</li>`);
          i++;
        }
        i--;
        html += `<ul>${items.join("")}</ul>`;
        continue;
      }

      if(/^\s*\d+\.\s+/.test(line)){
        const items = [];
        while(i < lines.length && /^\s*\d+\.\s+/.test(lines[i])){
          items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/,""))}</li>`);
          i++;
        }
        i--;
        html += `<ol>${items.join("")}</ol>`;
        continue;
      }

      if(line.trim() === ""){
        html += `<p></p>`;
        continue;
      }

      html += `<p>${inline(line)}</p>`;
    }

    return html;
  }

  /* ------------------------ Clipboard vault images ------------------------ */
  async function compressImageToDataURL(blob, maxW=1400, quality=0.82){
    const img = new Image();
    const url = URL.createObjectURL(blob);

    const loaded = await new Promise((res, rej) => {
      img.onload = () => res(true);
      img.onerror = () => rej(new Error("Image load failed"));
      img.src = url;
    });

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.min(1, maxW / w);
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, cw, ch);

    URL.revokeObjectURL(url);
    return canvas.toDataURL("image/jpeg", quality);
  }

  async function handlePaste(pane, e){
    lastInteraction = Date.now();
    const editor = pane === "L" ? editorL : editorR;

    // image paste
    const items = e.clipboardData?.items || [];
    for(const it of items){
      if(it.type && it.type.startsWith("image/")){
        e.preventDefault();
        const blob = it.getAsFile();
        if(!blob) continue;
        toast("Image captured", "Compressing and storing locally…", "warn");

        try{
          const dataUrl = await compressImageToDataURL(blob);
          wrapSelectionHTML(`<p><img src="${dataUrl}" style="max-width:100%; border-radius:14px; border:1px solid rgba(245,244,239,.10);" /></p>`);
          syncFromUI(pane);
          toast("Image saved", "Stored inside the note (local-only).");
          logEvent("image", activeNote(pane)?.id, {});
        }catch{
          toast("Image failed", "Couldn’t process that image.", "danger");
        }
        return;
      }
    }

    // markdown paste conversion
    if(prefs.markdownPaste){
      const text = e.clipboardData?.getData("text/plain");
      const html = e.clipboardData?.getData("text/html");
      // If user is pasting plain markdown-like text, convert:
      if(text && !html && /(^#\s)|(^##\s)|(^-\s)|(^\d+\.\s)|```/.test(text.trim())){
        e.preventDefault();
        wrapSelectionHTML(mdToHTML(text));
        syncFromUI(pane);
      }
    }
  }

  function collectImagesFromHTML(html){
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return Array.from(div.querySelectorAll("img")).map(img => img.getAttribute("src")).filter(Boolean);
  }

  /* ------------------------ Smart tags ------------------------ */
  const tagDictionary = [
    "microsoft 365","onedrive","sharepoint","entra","mfa","proofpoint",
    "hubspot","moxieworks","activepipe","moxiengage","moxipresent","moxiimpress",
    "appfiles","slack","calendly","adobe","luxury presence","google workspace",
    "dns","spf","dkim","dmarc","security","incident","vendor","onboarding"
  ];

  function smartTagSuggestions(note){
    const text = (note.title + " " + stripHTML(note.html)).toLowerCase();
    const found = new Set();

    // dictionary hits
    for(const t of tagDictionary){
      if(text.includes(t)) found.add(t.replace(/\s+/g,"-"));
    }

    // emails/phones hints
    if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) found.add("email");
    if(/\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text)) found.add("phone");
    if(/\b\d{4}-\d{2}-\d{2}\b/.test(text)) found.add("due-date");

    return Array.from(found);
  }

  /* ------------------------ Action Items parsing ------------------------ */
  function parseTasksFromNote(note){
    // Tasks are:
    // 1) checkline divs with checkbox
    // 2) lines starting with "Action:" in plain text
    const div = document.createElement("div");
    div.innerHTML = note.html || "";

    const out = [];

    // checklines
    div.querySelectorAll(".checkline").forEach((row, idx) => {
      const cb = row.querySelector('input[type="checkbox"]');
      const text = (row.textContent || "").trim();
      const done = cb ? cb.checked : false;
      const due = (text.match(/\bdue:\s*(\d{4}-\d{2}-\d{2})\b/i) || [])[1] || null;

      out.push({
        id: `${note.id}::cb::${idx}`,
        noteId: note.id,
        text,
        done,
        due
      });
    });

    // Action: lines (fallback)
    const plain = stripHTML(note.html);
    plain.split("\n").forEach((line, idx) => {
      const m = line.match(/^\s*action:\s*(.+)$/i);
      if(m){
        const due = (line.match(/\bdue:\s*(\d{4}-\d{2}-\d{2})\b/i) || [])[1] || null;
        out.push({
          id: `${note.id}::action::${idx}`,
          noteId: note.id,
          text: m[1].trim(),
          done: false,
          due
        });
      }
    });

    return out;
  }

  function collectAllTasks(){
    const tasks = [];
    for(const n of state.notes){
      tasks.push(...parseTasksFromNote(n));
    }
    return tasks;
  }

  function isDueSoon(dueStr){
    if(!dueStr) return false;
    const due = new Date(dueStr + "T00:00:00").getTime();
    const now = Date.now();
    const inDays = (due - now) / (1000*60*60*24);
    return inDays >= -1 && inDays <= 7;
  }

  /* ------------------------ Dashboard / Timeline / Tasks render ------------------------ */
  function renderDashboard(){
    if(state.view !== "dashboard") return;

    const pinned = sortNotes(state.notes.filter(n => n.pinned)).slice(0, 6);
    const recent = sortNotes(state.notes).slice(0, 8);

    const tagCount = new Map();
    state.notes.forEach(n => (n.tags||[]).forEach(t => tagCount.set(t, (tagCount.get(t)||0)+1)));
    const topTags = Array.from(tagCount.entries()).sort((a,b) => b[1]-a[1]).slice(0, 12);

    dashPinned.innerHTML = "";
    pinned.forEach(n => dashPinned.appendChild(dashItem(n)));

    dashRecent.innerHTML = "";
    recent.forEach(n => dashRecent.appendChild(dashItem(n)));

    dashTags.innerHTML = "";
    topTags.forEach(([t,c]) => {
      const el = document.createElement("div");
      el.className = "cardItem";
      el.innerHTML = `<div><strong>${escapeHTML(t)}</strong></div><div class="small">${c} note(s)</div>`;
      on(el, "click", () => {
        state.query = t;
        searchInput.value = t;
        setView("notes");
        renderAll();
      });
      dashTags.appendChild(el);
    });
  }

  function dashItem(n){
    const el = document.createElement("div");
    el.className = "cardItem";
    el.innerHTML = `<div><strong>${escapeHTML(n.title)}</strong></div><div class="small">Updated ${escapeHTML(relTime(n.updatedAt))}</div>`;
    on(el, "click", () => {
      setView("notes");
      openInPane("L", n.id);
    });
    return el;
  }

  function renderTimeline(){
    if(state.view !== "timeline") return;
    timeline.innerHTML = "";
    state.activity.slice(0, 120).forEach(ev => {
      const n = ev.noteId ? getNote(ev.noteId) : null;
      const el = document.createElement("div");
      el.className = "event";
      el.innerHTML = `
        <div class="t">${escapeHTML(ev.type)} ${n ? `• ${escapeHTML(n.title)}` : ""}</div>
        <div class="m">${escapeHTML(new Date(ev.ts).toLocaleString())}</div>
      `;
      on(el, "click", () => {
        if(n){
          setView("notes");
          openInPane("L", n.id);
        }
      });
      timeline.appendChild(el);
    });
  }

  function renderTasks(){
    if(state.view !== "tasks") return;

    const q = (taskSearch.value || "").trim().toLowerCase();
    const filter = taskFilter.value;

    let tasks = collectAllTasks();
    if(q){
      tasks = tasks.filter(t => (t.text||"").toLowerCase().includes(q));
    }
    if(filter === "open") tasks = tasks.filter(t => !t.done);
    if(filter === "done") tasks = tasks.filter(t => t.done);
    if(filter === "due") tasks = tasks.filter(t => !t.done && isDueSoon(t.due));

    taskList.innerHTML = "";
    tasks.slice(0, 200).forEach(t => {
      const n = getNote(t.noteId);
      const el = document.createElement("div");
      el.className = "task";
      el.innerHTML = `
        <input type="checkbox" ${t.done ? "checked":""} />
        <div>
          <div class="t">${escapeHTML(t.text)}</div>
          <div class="m">${escapeHTML(n ? n.title : "Unknown note")}</div>
        </div>
        ${t.due ? `<div class="badge ${isDueSoon(t.due) ? "due":""}">due ${escapeHTML(t.due)}</div>` : `<div class="badge">task</div>`}
      `;

      const cb = el.querySelector("input");
      on(cb, "change", () => {
        // Update the underlying note checkboxes if possible
        if(!n) return;
        // naive: toggle first matching checkline containing text
        const div = document.createElement("div");
        div.innerHTML = n.html || "";
        const rows = Array.from(div.querySelectorAll(".checkline"));
        const row = rows.find(r => (r.textContent||"").trim() === t.text.trim());
        if(row){
          const rowCb = row.querySelector('input[type="checkbox"]');
          if(rowCb) rowCb.checked = cb.checked;
          n.html = div.innerHTML;
          n.updatedAt = nowISO();
          logEvent("task-toggle", n.id, {done: cb.checked});
          if(state.activeId.L === n.id) renderPane("L", false);
          if(state.activeId.R === n.id) renderPane("R", false);
          schedulePersist();
          renderTasks();
        }else{
          toast("Task update", "This task came from plain text; edit in the note to mark complete.", "warn");
        }
      });

      on(el, "dblclick", () => {
        if(n){
          setView("notes");
          openInPane("L", n.id);
        }
      });

      taskList.appendChild(el);
    });
  }

  /* ------------------------ Spotlight (notes + commands) ------------------------ */
  let palMode = "all"; // all | notes | cmds

  function openSpotlight(){
    overlay.hidden = false;
    palInput.value = "";
    palMode = "all";
    setPalTabs();
    renderSpotlight("");
    setTimeout(() => palInput.focus(), 0);
  }
  function closeSpotlight(){
    overlay.hidden = true;
  }
  function setPalTabs(){
    [palTabAll, palTabNotes, palTabCmds].forEach(x => x.classList.remove("is-active"));
    if(palMode === "all") palTabAll.classList.add("is-active");
    if(palMode === "notes") palTabNotes.classList.add("is-active");
    if(palMode === "cmds") palTabCmds.classList.add("is-active");
  }

  const commands = [
    { key:"new", title:"New note", desc:"Create a fresh note", run: () => createNote() },
    { key:"template", title:"New from template", desc:"Pick a premium template", run: () => openTemplateModal() },
    { key:"export", title:"Export", desc:"Word / PDF / HTML exports", run: () => openExportModal() },
    { key:"backup", title:"Backup / Restore", desc:"Export/import JSON", run: () => openBackupModal() },
    { key:"split", title:"Toggle split view", desc:"Two notes side-by-side", run: () => toggleSplit() },
    { key:"dashboard", title:"Go to Dashboard", desc:"Pinned, recent, top tags", run: () => setView("dashboard") },
    { key:"tasks", title:"Go to Tasks", desc:"All action items across notes", run: () => setView("tasks") },
    { key:"timeline", title:"Go to Timeline", desc:"Activity log", run: () => setView("timeline") },
    { key:"vault enable", title:"Enable Vault encryption", desc:"Encrypt notes in this browser (AES-GCM)", run: async () => enableVaultFlow() },
    { key:"vault lock", title:"Lock Vault", desc:"Lock and require password to open", run: async () => lockVault() },
    { key:"settings", title:"Settings", desc:"Theme, glow, contrast, export options", run: () => openSettingsModal() },
  ];

  function scoreFuzzy(hay, q){
    // Simple fuzzy scoring: prefers early + consecutive matches
    hay = hay.toLowerCase();
    q = q.toLowerCase();
    if(!q) return 0;
    let score = 0;
    let hi = 0;
    for(let qi=0; qi<q.length; qi++){
      const ch = q[qi];
      const pos = hay.indexOf(ch, hi);
      if(pos === -1) return -999;
      score += (pos === hi ? 12 : 6) - Math.min(5, pos*0.02);
      hi = pos + 1;
    }
    // boost if substring
    if(hay.includes(q)) score += 40;
    return score;
  }

  function renderSpotlight(q){
    const query = (q || "").trim();

    const noteRows = sortNotes(state.notes)
      .map(n => ({
        type:"note",
        id:n.id,
        title:n.title,
        desc:`Updated ${relTime(n.updatedAt)} • ${(n.tags||[]).slice(0,4).join(", ")}`,
        score: scoreFuzzy(n.title + " " + stripHTML(n.html) + " " + (n.tags||[]).join(" "), query)
      }))
      .filter(x => query ? x.score > -50 : true)
      .sort((a,b) => b.score - a.score)
      .slice(0, 12);

    const cmdRows = commands
      .map(c => ({
        type:"cmd",
        key:c.key,
        title:c.title,
        desc:c.desc,
        score: scoreFuzzy(c.key + " " + c.title + " " + c.desc, query)
      }))
      .filter(x => query ? x.score > -50 : true)
      .sort((a,b) => b.score - a.score)
      .slice(0, 10);

    let rows = [];
    if(palMode === "all") rows = [...noteRows, ...cmdRows].sort((a,b) => b.score - a.score).slice(0, 16);
    if(palMode === "notes") rows = noteRows;
    if(palMode === "cmds") rows = cmdRows;

    palList.innerHTML = "";
    rows.forEach(r => {
      const el = document.createElement("div");
      el.className = "row";
      el.innerHTML = `<div class="row__t">${escapeHTML(r.title)}</div><div class="row__d">${escapeHTML(r.desc || "")}</div>`;
      on(el, "click", async () => {
        closeSpotlight();
        if(r.type === "note"){
          setView("notes");
          openInPane("L", r.id);
        }else{
          const cmd = commands.find(c => c.key === r.key);
          if(cmd) await cmd.run();
        }
      });
      palList.appendChild(el);
    });
  }

  /* ------------------------ Create / Delete / Pin ------------------------ */
  function createNote(){
    const n = makeNote({ title:"Untitled note", html:"" });
    state.notes.unshift(n);
    openInPane("L", n.id);
    logEvent("create", n.id, {});
    toast("New note", "Created and ready.");
    schedulePersist();
  }

  function deleteNote(noteId){
    const n = getNote(noteId);
    if(!n) return;
    const ok = confirm(`Delete "${n.title}"?\n\nThis removes it from this browser.`);
    if(!ok) return;

    state.notes = state.notes.filter(x => x.id !== noteId);
    // remove from tabs
    ["L","R"].forEach(p => {
      state.activeTabs[p] = state.activeTabs[p].filter(id => id !== noteId);
      if(state.activeId[p] === noteId) state.activeId[p] = state.activeTabs[p][0] || null;
    });

    logEvent("delete", noteId, {});
    toast("Deleted", n.title, "danger");
    renderAll();
    schedulePersist();
  }

  function togglePin(noteId){
    const n = getNote(noteId);
    if(!n) return;
    n.pinned = !n.pinned;
    n.updatedAt = nowISO();
    logEvent(n.pinned ? "pin" : "unpin", noteId, {});
    toast(n.pinned ? "Pinned" : "Unpinned", n.title);
    renderAll();
    schedulePersist();
  }

  /* ------------------------ Gallery modal ------------------------ */
  function openGalleryModal(pane){
    const n = activeNote(pane);
    if(!n) return;

    const imgs = collectImagesFromHTML(n.html);
    const html = `
      <h3>Image Gallery • ${escapeHTML(n.title)}</h3>
      ${imgs.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:6px;">
        ${imgs.map(src => `
          <div class="glass" style="border-radius:18px; padding:10px; overflow:hidden;">
            <img src="${src}" style="width:100%; border-radius:14px; display:block;" />
            <button class="rowBtn" data-copy="${escapeHTML(src)}">Copy image data</button>
          </div>
        `).join("")}
      </div>` : `<div style="padding:6px;color:rgba(245,244,239,.7)">No images in this note yet. Paste an image to add one.</div>`}
      <div class="modalActions">
        <button class="btn btn--ghost" id="mClose">Close</button>
      </div>
    `;
    openModal(html);
    $$("#modal [data-copy]").forEach(b => {
      on(b, "click", async () => {
        try{
          await navigator.clipboard.writeText(b.getAttribute("data-copy"));
          toast("Copied", "Image data copied.");
        }catch{
          toast("Copy failed", "Clipboard blocked by browser.", "warn");
        }
      });
    });
    on($("#mClose"), "click", closeModal);
  }

  /* ------------------------ Version history modal ------------------------ */
  function simpleDiff(oldHtml, newHtml){
    // Basic line diff on text content (clean + readable)
    const a = stripHTML(oldHtml).split("\n").map(x => x.trim()).filter(Boolean);
    const b = stripHTML(newHtml).split("\n").map(x => x.trim()).filter(Boolean);

    const aSet = new Set(a);
    const bSet = new Set(b);

    const removed = a.filter(x => !bSet.has(x)).slice(0, 12);
    const added = b.filter(x => !aSet.has(x)).slice(0, 12);

    return { added, removed };
  }

  function openHistoryModal(pane){
    const n = activeNote(pane);
    if(!n) return;

    const items = [...n.history].reverse(); // newest first

    const html = `
      <h3>Version History • ${escapeHTML(n.title)}</h3>
      <div style="padding:6px;color:rgba(245,244,239,.7)">
        Snapshots auto-capture every ~${prefs.snapMins} min while editing (up to 40). Click one to preview diff + restore.
      </div>
      <div id="histList" style="padding:6px;">
        ${items.length ? items.map((h, idx) => `
          <button class="rowBtn" data-idx="${idx}">
            ${escapeHTML(new Date(h.ts).toLocaleString())} • ${escapeHTML(stripHTML(h.html).slice(0,80) || "—")}
          </button>
        `).join("") : `<div style="padding:6px;color:rgba(245,244,239,.7)">No snapshots yet. Keep editing and autosave will capture versions.</div>`}
      </div>
      <div id="histPreview" style="padding:6px;"></div>
      <div class="modalActions">
        <button class="btn btn--ghost" id="mClose">Close</button>
      </div>
    `;
    openModal(html);

    const histPreview = $("#histPreview");
    const listEl = $("#histList");

    $$("#modal [data-idx]").forEach(btn => {
      on(btn, "click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        const snap = items[idx];
        if(!snap) return;

        const diff = simpleDiff(snap.html, n.html);

        histPreview.innerHTML = `
          <div class="glass" style="border-radius:24px; padding:14px;">
            <div style="font-weight:760;">Preview</div>
            <div style="margin-top:8px;color:rgba(245,244,239,.78); font-size:12px;">Snapshot: ${escapeHTML(new Date(snap.ts).toLocaleString())}</div>
            <div style="margin-top:12px;">
              <div style="font-weight:740; margin-bottom:6px;">Added (current)</div>
              ${diff.added.length ? `<ul>${diff.added.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>` : `<div style="color:rgba(245,244,239,.6)">No added lines detected.</div>`}
              <div style="font-weight:740; margin-top:12px; margin-bottom:6px;">Removed (snapshot)</div>
              ${diff.removed.length ? `<ul>${diff.removed.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>` : `<div style="color:rgba(245,244,239,.6)">No removed lines detected.</div>`}
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:12px;">
              <button class="btn" id="restoreBtn">Restore Snapshot</button>
            </div>
          </div>
        `;

        on($("#restoreBtn"), "click", () => {
          const ok = confirm("Restore this snapshot? This overwrites the current note content.");
          if(!ok) return;
          n.title = snap.title || n.title;
          n.html = snap.html || n.html;
          n.updatedAt = nowISO();
          logEvent("restore", n.id, {});
          renderPane(pane, true);
          renderTabs();
          renderList();
          schedulePersist();
          toast("Restored", "Snapshot restored.");
          closeModal();
        });
      });
    });

    on($("#mClose"), "click", closeModal);
  }

  /* ------------------------ Export (Word/PDF/HTML) + redaction ------------------------ */
  function redactText(s){
    // mask emails + phone numbers
    const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    const phone = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    return s.replace(email, "████@████.██").replace(phone, "███-███-████");
  }

  function sanitizeFileName(name){
    return (name || "PTC Notes")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }

  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function exportWord(which="current"){
    const notes = which === "all" ? sortNotes(state.notes) : [activeNote("L")].filter(Boolean);
    if(!notes.length){ toast("Nothing to export", "Create a note first.", "warn"); return; }

    const docTitle = which === "all" ? "PTC Notes Vault — All Notes" : notes[0].title;
    const titleSafe = escapeHTML(docTitle);
    const toc = notes.map((n,i) => `<li><a href="#n${i}">${escapeHTML(n.title)}</a></li>`).join("");

    const blocks = notes.map((n, idx) => {
      let content = n.html || "<p></p>";
      if(prefs.redactOnExport){
        content = redactText(stripHTML(content)).split("\n").map(x => `<p>${escapeHTML(x)}</p>`).join("");
      }
      return `
        <div class="noteBlock" id="n${idx}">
          <h1>${escapeHTML(n.title || "Untitled note")}</h1>
          <div class="metaLine">Created: ${escapeHTML(new Date(n.createdAt).toLocaleString())} • Updated: ${escapeHTML(new Date(n.updatedAt).toLocaleString())}</div>
          ${(n.tags||[]).length ? `<div class="tagLine">${escapeHTML((n.tags||[]).map(t=>`#${t}`).join(" "))}</div>` : ``}
          <div class="content">${content}</div>
        </div>
        ${idx < notes.length-1 ? `<div class="pagebreak"></div>` : ``}
      `;
    }).join("");

    const html = `
      <html><head><meta charset="utf-8"><title>${titleSafe}</title>
      <style>
        body{ font-family: Calibri, Arial, sans-serif; margin: 28px; color:#111; }
        h1{ font-size: 20pt; margin: 0 0 8px; }
        h2{ font-size: 14pt; margin: 18px 0 8px; }
        .metaLine{ color:#444; font-size: 10pt; margin-bottom: 6px; }
        .tagLine{ color:#555; font-size: 10pt; margin-bottom: 12px; }
        .content{ font-size: 11.5pt; line-height: 1.45; }
        blockquote{ border-left: 3px solid #bbb; padding-left: 10px; color:#333; }
        pre{ background:#f3f3f3; padding:10px; }
        table{ border-collapse: collapse; width:100%; }
        td,th{ border:1px solid #ccc; padding:6px; }
        .pagebreak{ page-break-after: always; }
      </style>
      </head><body>
        <div>
          <h1>${titleSafe}</h1>
          <div class="metaLine">Exported: ${escapeHTML(new Date().toLocaleString())}</div>
          <h2>Table of Contents</h2>
          <ol>${toc}</ol>
        </div>
        <div class="pagebreak"></div>
        ${blocks}
      </body></html>
    `;

    const blob = new Blob([html], { type: "application/msword" });
    const fileName = sanitizeFileName(docTitle) + ".doc";
    downloadBlob(blob, fileName);
    toast("Exported Word", fileName);
    logEvent("export-word", null, {which});
  }

  async function exportPDF(which="current"){
    const notes = which === "all" ? sortNotes(state.notes) : [activeNote("L")].filter(Boolean);
    if(!notes.length){ toast("Nothing to export", "Create a note first.", "warn"); return; }
    if(typeof window.html2pdf === "undefined"){
      toast("PDF library missing", "html2pdf failed to load.", "danger");
      return;
    }

    // Build a temporary DOM for clean PDF render
    const wrapper = document.createElement("div");
    wrapper.style.padding = "18px";
    wrapper.style.fontFamily = "Arial, sans-serif";
    wrapper.style.color = "#111";
    wrapper.style.background = "#fff";

    const title = document.createElement("h1");
    title.textContent = which === "all" ? "PTC Notes Vault — All Notes" : (notes[0].title || "PTC Note");
    wrapper.appendChild(title);

    const meta = document.createElement("div");
    meta.style.marginBottom = "16px";
    meta.style.color = "#333";
    meta.textContent = `Exported: ${new Date().toLocaleString()}`;
    wrapper.appendChild(meta);

    notes.forEach((n, idx) => {
      const h = document.createElement("h2");
      h.textContent = n.title || "Untitled note";
      wrapper.appendChild(h);

      const m = document.createElement("div");
      m.style.color = "#444";
      m.style.fontSize = "12px";
      m.style.marginBottom = "8px";
      m.textContent = `Updated: ${new Date(n.updatedAt).toLocaleString()}`;
      wrapper.appendChild(m);

      let contentHTML = n.html || "<p></p>";
      if(prefs.redactOnExport){
        const red = redactText(stripHTML(contentHTML));
        contentHTML = red.split("\n").map(x => `<p>${escapeHTML(x)}</p>`).join("");
      }

      const c = document.createElement("div");
      c.innerHTML = contentHTML;
      wrapper.appendChild(c);

      if(idx < notes.length-1){
        const hr = document.createElement("hr");
        hr.style.margin = "18px 0";
        wrapper.appendChild(hr);
      }
    });

    const fileName = sanitizeFileName(title.textContent) + ".pdf";

    toast("Exporting PDF", "Generating…", "warn");
    await window.html2pdf()
      .set({
        margin: 10,
        filename: fileName,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(wrapper)
      .save();

    toast("Exported PDF", fileName);
    logEvent("export-pdf", null, {which});
  }

  function exportHTML(which="current"){
    const notes = which === "all" ? sortNotes(state.notes) : [activeNote("L")].filter(Boolean);
    if(!notes.length){ toast("Nothing to export", "Create a note first.", "warn"); return; }

    const title = which === "all" ? "PTC Notes Vault — All Notes" : (notes[0].title || "PTC Note");
    const blocks = notes.map(n => {
      let body = n.html || "<p></p>";
      if(prefs.redactOnExport){
        const red = redactText(stripHTML(body));
        body = red.split("\n").map(x => `<p>${escapeHTML(x)}</p>`).join("");
      }
      return `
        <article class="card">
          <h2>${escapeHTML(n.title || "Untitled")}</h2>
          <div class="meta">Updated: ${escapeHTML(new Date(n.updatedAt).toLocaleString())}</div>
          <div class="content">${body}</div>
        </article>
      `;
    }).join("");

    const html = `
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(title)}</title>
<style>
  body{ margin:0; padding:24px; font-family: Arial, sans-serif; background:#0b0b0b; color:#f5f4ef; }
  h1{ margin:0 0 14px; }
  .metaTop{ color: rgba(245,244,239,.75); margin-bottom: 18px; }
  .card{ background: rgba(34,36,34,.78); border:1px solid rgba(245,244,239,.14); border-radius:20px; padding:16px; margin-bottom:14px; }
  .meta{ color: rgba(245,244,239,.70); font-size: 12px; margin-bottom: 10px; }
  img{ max-width:100%; border-radius: 14px; border:1px solid rgba(245,244,239,.10); }
  pre{ background: rgba(0,0,0,.35); padding:12px; border-radius:14px; overflow:auto; }
  table{ width:100%; border-collapse: collapse; border-radius:14px; overflow:hidden; }
  td,th{ border:1px solid rgba(245,244,239,.12); padding:8px; }
</style></head>
<body>
  <h1>${escapeHTML(title)}</h1>
  <div class="metaTop">Read-only export • ${escapeHTML(new Date().toLocaleString())}</div>
  ${blocks}
</body></html>`;

    const blob = new Blob([html], { type:"text/html" });
    const fileName = sanitizeFileName(title) + " (read-only).html";
    downloadBlob(blob, fileName);
    toast("Exported HTML", fileName);
    logEvent("export-html", null, {which});
  }

  function openExportModal(){
    const html = `
      <h3>Export</h3>
      <div style="padding:6px;color:rgba(245,244,239,.75)">
        Exports are generated locally. Optional redaction masks emails & phone numbers.
      </div>

      <button class="rowBtn" id="exWordCur">Export Word (.doc) — current note</button>
      <button class="rowBtn" id="exWordAll">Export Word (.doc) — all notes</button>

      <button class="rowBtn" id="exPdfCur">Export PDF — current note</button>
      <button class="rowBtn" id="exPdfAll">Export PDF — all notes</button>

      <button class="rowBtn" id="exHtmlCur">Export Read-only HTML — current note</button>
      <button class="rowBtn" id="exHtmlAll">Export Read-only HTML — all notes</button>

      <div style="padding:6px; display:flex; gap:10px; align-items:center;">
        <input type="checkbox" id="redactToggle" ${prefs.redactOnExport ? "checked":""} />
        <label for="redactToggle" style="color:rgba(245,244,239,.84)">Redact emails & phone numbers on export</label>
      </div>

      <div class="modalActions">
        <button class="btn btn--ghost" id="mClose">Close</button>
      </div>
    `;
    openModal(html);

    on($("#redactToggle"), "change", (e) => {
      prefs.redactOnExport = !!e.target.checked;
      savePrefs();
      toast("Export setting saved", prefs.redactOnExport ? "Redaction enabled." : "Redaction disabled.");
    });

    on($("#exWordCur"), "click", () => exportWord("current"));
    on($("#exWordAll"), "click", () => exportWord("all"));
    on($("#exPdfCur"), "click", () => exportPDF("current"));
    on($("#exPdfAll"), "click", () => exportPDF("all"));
    on($("#exHtmlCur"), "click", () => exportHTML("current"));
    on($("#exHtmlAll"), "click", () => exportHTML("all"));
    on($("#mClose"), "click", closeModal);
  }

  /* ------------------------ Backup / Restore JSON ------------------------ */
  function exportBackup(){
    const blob = new Blob([JSON.stringify({
      exportedAt: nowISO(),
      app: "PTC Notes Vault Premium",
      version: 1,
      state
    }, null, 2)], { type: "application/json" });
    downloadBlob(blob, "ptc-notes-vault-backup.json");
    toast("Backup exported", "ptc-notes-vault-backup.json");
    logEvent("backup-export", null, {});
  }

  function importBackupFile(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        const incoming = normalizeState(data?.state);
        if(!incoming.notes.length) throw new Error("No notes found.");

        // Merge notes by id (incoming wins)
        const map = new Map(state.notes.map(n => [n.id, n]));
        incoming.notes.forEach(n => map.set(n.id, n));
        state.notes = sortNotes(Array.from(map.values()));

        // merge activity (optional)
        const act = [...(incoming.activity||[]), ...(state.activity||[])].slice(0,200);
        state.activity = act;

        // keep current view/tabs if possible
        if(!state.notes.find(n => n.id === state.activeId.L)){
          state.activeId.L = state.notes[0].id;
          state.activeTabs.L = [state.activeId.L];
        }

        toast("Backup imported", `${incoming.notes.length} note(s) merged.`);
        logEvent("backup-import", null, {});
        renderAll();
        schedulePersist();
      }catch{
        toast("Import failed", "That JSON didn’t look valid.", "danger");
      }
    };
    reader.readAsText(file);
  }

  function openBackupModal(){
    const html = `
      <h3>Backup / Restore</h3>
      <div style="padding:6px;color:rgba(245,244,239,.75)">
        Backup is strongly recommended (local storage can be cleared by browsers).
      </div>
      <button class="rowBtn" id="bkExport">Export Backup (JSON)</button>
      <button class="rowBtn" id="bkImport">Import Backup (JSON)</button>
      <div class="modalActions">
        <button class="btn btn--ghost" id="mClose">Close</button>
      </div>
    `;
    openModal(html);
    on($("#bkExport"), "click", () => exportBackup());
    on($("#bkImport"), "click", () => importFile.click());
    on($("#mClose"), "click", closeModal);
  }

  /* ------------------------ Settings modal ------------------------ */
  function openSettingsModal(){
    const html = `
      <h3>Settings</h3>
      <div style="padding:6px;color:rgba(245,244,239,.75)">
        These settings are stored locally in your browser.
      </div>

      <div class="glass" style="border-radius:24px; padding:14px; margin: 6px;">
        <div style="font-weight:760; margin-bottom:10px;">Theme</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="rowBtn" id="thExec">Executive</button>
          <button class="rowBtn" id="thMin">Ultra-minimal</button>
          <button class="rowBtn" id="thHi">High contrast</button>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px;">
          <div>
            <div style="color:rgba(245,244,239,.75); font-size:12px; margin-bottom:6px;">Glow strength</div>
            <input id="glowRange" type="range" min="0.6" max="1.2" step="0.05" value="${prefs.glow}" style="width:100%" />
          </div>
          <div>
            <div style="color:rgba(245,244,239,.75); font-size:12px; margin-bottom:6px;">Contrast</div>
            <input id="contrastRange" type="range" min="1" max="1.15" step="0.01" value="${prefs.contrast}" style="width:100%" />
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center; margin-top:12px;">
          <input type="checkbox" id="mdPaste" ${prefs.markdownPaste ? "checked":""} />
          <label for="mdPaste" style="color:rgba(245,244,239,.84)">Convert Markdown-like paste into formatted notes</label>
        </div>

        <div style="display:flex; gap:10px; align-items:center; margin-top:10px;">
          <input type="checkbox" id="powerMode" ${prefs.powerMode ? "checked":""} />
          <label for="powerMode" style="color:rgba(245,244,239,.84)">Power Mode (extra shortcuts)</label>
        </div>

        <div style="margin-top:12px;">
          <div style="color:rgba(245,244,239,.75); font-size:12px; margin-bottom:6px;">History snapshot cadence (minutes)</div>
          <input id="snapMins" type="number" min="1" max="10" value="${prefs.snapMins}" style="width:120px; padding:10px; border-radius:14px; border:1px solid rgba(245,244,239,.10); background:rgba(0,0,0,.14); color:var(--text)" />
        </div>
      </div>

      <div class="modalActions">
        <button class="btn btn--ghost" id="mClose">Close</button>
      </div>
    `;
    openModal(html);

    const setThemeName = (t) => { prefs.theme = t; savePrefs(); toast("Theme updated", t); };

    on($("#thExec"), "click", () => setThemeName("executive"));
    on($("#thMin"), "click", () => setThemeName("minimal"));
    on($("#thHi"), "click", () => setThemeName("highContrast"));

    on($("#glowRange"), "input", (e) => { prefs.glow = parseFloat(e.target.value); savePrefs(); });
    on($("#contrastRange"), "input", (e) => { prefs.contrast = parseFloat(e.target.value); savePrefs(); });

    on($("#mdPaste"), "change", (e) => { prefs.markdownPaste = !!e.target.checked; savePrefs(); });
    on($("#powerMode"), "change", (e) => { prefs.powerMode = !!e.target.checked; savePrefs(); });

    on($("#snapMins"), "change", (e) => {
      const v = Math.max(1, Math.min(10, parseInt(e.target.value||"2",10)));
      prefs.snapMins = v;
      savePrefs();
      toast("Snapshots updated", `${v} minute cadence`);
    });

    on($("#mClose"), "click", closeModal);
  }

  /* ------------------------ Template modal ------------------------ */
  function openTemplateModal(){
    const keys = Object.keys(templates);
    const html = `
      <h3>Templates</h3>
      <div style="padding:6px;color:rgba(245,244,239,.75)">
        Create a premium structured note instantly.
      </div>
      ${keys.map(k => `<button class="rowBtn" data-template="${escapeHTML(k)}">${escapeHTML(k)}</button>`).join("")}
      <div class="modalActions">
        <button class="btn btn--ghost" id="mClose">Close</button>
      </div>
    `;
    openModal(html);
    $$("#modal [data-template]").forEach(b => {
      on(b, "click", () => {
        const name = b.getAttribute("data-template");
        const n = makeNoteFromTemplate(name);
        state.notes.unshift(n);
        openInPane("L", n.id);
        logEvent("template", n.id, {name});
        toast("Template created", name);
        closeModal();
        schedulePersist();
      });
    });
    on($("#mClose"), "click", closeModal);
  }

  /* ------------------------ Vault modal ------------------------ */
  function openVaultModal(){
    const html = `
      <h3>Vault</h3>
      <div style="padding:6px;color:rgba(245,244,239,.75)">
        Vault encrypts your notes in this browser using AES-GCM. If you forget the password, the data cannot be recovered.
      </div>

      <button class="rowBtn" id="vEnable" ${vault.enabled ? "disabled":""}>Enable Vault encryption</button>
      <button class="rowBtn" id="vLock" ${vault.enabled ? "":"disabled"}>Lock Vault now</button>
      <button class="rowBtn" id="vWipe" style="border-color:rgba(255,206,102,.30);">Wipe Vault data from this browser</button>

      <div style="padding:6px; margin-top:10px;">
        <div style="color:rgba(245,244,239,.75); font-size:12px; margin-bottom:6px;">Auto-lock minutes (inactivity)</div>
        <input id="autoLock" type="number" min="1" max="60" value="${prefs.autoLockMins}" style="width:120px; padding:10px; border-radius:14px; border:1px solid rgba(245,244,239,.10); background:rgba(0,0,0,.14); color:var(--text)" />
      </div>

      <div class="modalActions">
        <button class="btn btn--ghost" id="mClose">Close</button>
      </div>
    `;
    openModal(html);

    on($("#vEnable"), "click", async () => {
      await enableVaultFlow();
      closeModal();
      schedulePersist();
    });

    on($("#vLock"), "click", async () => {
      closeModal();
      await lockVault();
    });

    on($("#vWipe"), "click", () => {
      const ok = confirm("Wipe Vault data from this browser? This cannot be undone.");
      if(!ok) return;
      closeModal();
      wipeVault();
    });

    on($("#autoLock"), "change", (e) => {
      const v = Math.max(1, Math.min(60, parseInt(e.target.value||"10",10)));
      prefs.autoLockMins = v;
      savePrefs();
      toast("Auto-lock updated", `${v} minutes`);
    });

    on($("#mClose"), "click", closeModal);
  }

  /* ------------------------ Modal helpers ------------------------ */
  function openModal(innerHTML){
    modalCard.innerHTML = innerHTML;
    modal.hidden = false;
    modalCard.scrollTop = 0;
  }
  function closeModal(){
    modal.hidden = true;
    modalCard.innerHTML = "";
  }

  on(modal, "click", (e) => {
    if(e.target === modal) closeModal();
  });

  /* ------------------------ Toolbar bindings ------------------------ */
  function bindToolbar(){
    // execCmd buttons
    $$(".toolbar .iconbtn[data-cmd]").forEach(b => {
      on(b, "click", () => {
        lastInteraction = Date.now();
        const cmd = b.getAttribute("data-cmd");
        execCmd(cmd);
        const pane = b.closest(".toolbar").getAttribute("data-pane");
        syncFromUI(pane);
      });
    });

    // action buttons
    $$(".toolbar .iconbtn[data-action]").forEach(b => {
      on(b, "click", () => {
        lastInteraction = Date.now();
        const action = b.getAttribute("data-action");
        const pane = b.closest(".toolbar").getAttribute("data-pane");
        const n = activeNote(pane);
        if(!n) return;

        // focus editor
        (pane === "L" ? editorL : editorR).focus();

        if(action === "bullets"){ execCmd("insertUnorderedList"); syncFromUI(pane); }
        if(action === "numbers"){ execCmd("insertOrderedList"); syncFromUI(pane); }
        if(action === "h2"){ execCmd("formatBlock","h2"); syncFromUI(pane); }
        if(action === "link"){ insertLink(); syncFromUI(pane); }
        if(action === "clear"){ clearFormatting(); syncFromUI(pane); }
        if(action === "checklist"){ insertChecklist(); syncFromUI(pane); }
        if(action === "table"){ insertTable(); syncFromUI(pane); }
        if(action === "code"){ insertCodeBlock(); syncFromUI(pane); }
        if(action === "callout"){ insertCallout(); syncFromUI(pane); }
        if(action === "gallery"){ openGalleryModal(pane); }
        if(action === "history"){ openHistoryModal(pane); }
        if(action === "pin"){ togglePin(n.id); }
        if(action === "delete"){ deleteNote(n.id); }

      });
    });
  }

  /* ------------------------ Tags input ------------------------ */
  function bindTags(){
    const bind = (pane, inputEl) => {
      on(inputEl, "keydown", (e) => {
        if(e.key !== "Enter") return;
        e.preventDefault();
        const n = activeNote(pane);
        if(!n) return;

        const t = (inputEl.value || "").trim().toLowerCase();
        if(!t) return;

        if(!n.tags.includes(t)){
          n.tags.push(t);
          n.updatedAt = nowISO();
          logEvent("tag-added", n.id, {tag:t});
          schedulePersist();
          renderTags(pane);
          renderList();
          toast("Tag added", t);
        }
        inputEl.value = "";
      });
    };
    bind("L", tagInputL);
    bind("R", tagInputR);
  }

  /* ------------------------ Editor checkbox interaction ------------------------ */
  function bindCheckboxClicks(){
    const handler = (pane, e) => {
      const t = e.target;
      if(t && t.tagName === "INPUT" && t.type === "checkbox"){
        // update html after checkbox toggle
        syncFromUI(pane);
        toast("Task updated", t.checked ? "Marked complete." : "Re-opened.");
      }
    };
    on(editorL, "click", (e) => handler("L", e));
    on(editorR, "click", (e) => handler("R", e));
  }

  /* ------------------------ Navigation bindings ------------------------ */
  function bindNav(){
    on(navNotes, "click", () => setView("notes"));
    on(navDashboard, "click", () => setView("dashboard"));
    on(navTasks, "click", () => setView("tasks"));
    on(navTimeline, "click", () => setView("timeline"));
  }

  /* ------------------------ Main render ------------------------ */
  function renderAll(){
    setTheme();
    setSubline();

    // chips
    chipAll.classList.toggle("is-active", state.filter === "all");
    chipPinned.classList.toggle("is-active", state.filter === "pinned");
    chipRecent.classList.toggle("is-active", state.filter === "recent");

    // split
    panes.classList.toggle("is-split", state.split);
    paneRight.hidden = !state.split;
    tabsRight.hidden = !state.split;
    tabsDivider.hidden = !state.split;

    // list
    renderList();

    // tabs
    renderTabs();

    // panes
    renderPane("L", true);
    renderPane("R", true);

    // view
    setView(state.view || "notes");
  }

  /* ------------------------ Auto-lock handling ------------------------ */
  function tickAutoLock(){
    if(!vault.enabled || vault.locked) return;
    const mins = Math.max(1, prefs.autoLockMins);
    const ms = mins * 60 * 1000;
    if(Date.now() - lastInteraction > ms){
      toast("Vault auto-lock", "Locked due to inactivity.", "warn");
      lockVault();
    }
  }

  /* ------------------------ Boot sequence ------------------------ */
  async function boot(){
    loadPrefs();

    // detect vault meta
    const meta = loadVaultMeta();
    if(meta?.enabled){
      vault.enabled = true;
      vault.locked = true;
      vault.saltB64 = meta.saltB64;
      vault.ivB64 = meta.ivB64;
      vault.cipherB64 = meta.cipherB64;

      elLock.hidden = false;
      elApp.hidden = true;
      setSubline();
    } else {
      // plain load
      const loaded = loadPlain();
      if(loaded){
        state = loaded;
        // ensure at least one note
        if(!state.notes.length) seedFirstRun();
        // ensure active tab
        if(!state.activeId.L && state.notes[0]) state.activeId.L = state.notes[0].id;
        if(!state.activeTabs.L.length && state.activeId.L) state.activeTabs.L = [state.activeId.L];
      } else {
        seedFirstRun();
      }

      elLock.hidden = true;
      elApp.hidden = false;
      renderAll();
    }

    /* ---------------- event bindings ---------------- */
    bindToolbar();
    bindTags();
    bindCheckboxClicks();
    bindNav();

    // filters
    on(chipAll, "click", () => { state.filter="all"; renderList(); schedulePersist(); });
    on(chipPinned, "click", () => { state.filter="pinned"; renderList(); schedulePersist(); });
    on(chipRecent, "click", () => { state.filter="recent"; renderList(); schedulePersist(); });

    // search
    on(searchInput, "input", () => {
      state.query = searchInput.value;
      renderList();
    });

    // buttons
    on(btnSpotlight, "click", openSpotlight);
    on(btnNew, "click", () => createNote());
    on(btnTemplate, "click", () => openTemplateModal());
    on(btnExport, "click", () => openExportModal());
    on(btnBackup, "click", () => openBackupModal());
    on(btnSplit, "click", () => toggleSplit());
    on(btnVault, "click", () => openVaultModal());
    on(btnSettings, "click", () => openSettingsModal());

    // modal close on ESC
    on(window, "keydown", (e) => {
      if(e.key === "Escape"){
        if(!overlay.hidden) closeSpotlight();
        if(!modal.hidden) closeModal();
      }
    });

    // spotlight bindings
    on(overlay, "click", (e) => { if(e.target === overlay) closeSpotlight(); });
    on(palInput, "input", () => renderSpotlight(palInput.value));
    on(palTabAll, "click", () => { palMode="all"; setPalTabs(); renderSpotlight(palInput.value); });
    on(palTabNotes, "click", () => { palMode="notes"; setPalTabs(); renderSpotlight(palInput.value); });
    on(palTabCmds, "click", () => { palMode="cmds"; setPalTabs(); renderSpotlight(palInput.value); });

    // import file
    on(importFile, "change", (e) => {
      const f = e.target.files?.[0];
      if(f) importBackupFile(f);
      importFile.value = "";
    });

    // tasks
    on(btnTaskRefresh, "click", () => renderTasks());
    on(taskSearch, "input", () => renderTasks());
    on(taskFilter, "change", () => renderTasks());

    // unlock vault
    on(btnUnlock, "click", async () => {
      const p = unlockPass.value;
      if(!p) return;
      vaultPassCache.value = p; // keep in memory while unlocked
      await unlockVaultFlow(p);
      lastInteraction = Date.now();
    });

    on(unlockPass, "keydown", async (e) => {
      if(e.key === "Enter"){
        const p = unlockPass.value;
        if(!p) return;
        vaultPassCache.value = p;
        await unlockVaultFlow(p);
        lastInteraction = Date.now();
      }
    });

    on(btnVaultWipe, "click", () => {
      const ok = confirm("Wipe vault data from this browser? This cannot be undone.");
      if(ok) wipeVault();
    });

    // editor sync
    const bindEditor = (pane, titleEl, editorEl) => {
      on(titleEl, "input", () => { lastInteraction = Date.now(); syncFromUI(pane); });
      on(editorEl, "input", () => { lastInteraction = Date.now(); syncFromUI(pane); });
      on(editorEl, "paste", (e) => handlePaste(pane, e));
    };

    bindEditor("L", titleL, editorL);
    bindEditor("R", titleR, editorR);

    // keyboard shortcuts
    on(window, "keydown", async (e) => {
      lastInteraction = Date.now();
      const mod = modKey(e);

      if(mod && e.key.toLowerCase() === "k"){
        e.preventDefault();
        overlay.hidden ? openSpotlight() : closeSpotlight();
      }

      if(mod && e.key.toLowerCase() === "n"){
        e.preventDefault();
        createNote();
      }

      if(mod && e.key === "\\"){
        e.preventDefault();
        toggleSplit();
      }

      if(mod && e.key === "/"){
        e.preventDefault();
        openTemplateModal();
      }

      if(prefs.powerMode && mod && e.key.toLowerCase() === "1"){ e.preventDefault(); setView("notes"); }
      if(prefs.powerMode && mod && e.key.toLowerCase() === "2"){ e.preventDefault(); setView("dashboard"); }
      if(prefs.powerMode && mod && e.key.toLowerCase() === "3"){ e.preventDefault(); setView("tasks"); }
      if(prefs.powerMode && mod && e.key.toLowerCase() === "4"){ e.preventDefault(); setView("timeline"); }

      // quick note switch in current pane (J/K)
      if(prefs.powerMode && mod && e.key.toLowerCase() === "j"){
        e.preventDefault();
        cycleTab("L", +1);
      }
      if(prefs.powerMode && mod && e.key.toLowerCase() === "k"){
        // already spotlight; do nothing here
      }
      if(prefs.powerMode && mod && e.key.toLowerCase() === "h"){
        e.preventDefault();
        cycleTab("L", -1);
      }
    });

    function cycleTab(pane, dir){
      const group = state.activeTabs[pane] || [];
      const cur = state.activeId[pane];
      const idx = group.indexOf(cur);
      if(idx < 0 || group.length < 2) return;
      const next = (idx + dir + group.length) % group.length;
      openInPane(pane, group[next]);
    }

    // auto-lock tick
    setInterval(tickAutoLock, 5000);

    toast("Ready", "Autosave is on • Local-only storage.");
  }

  /* ------------------------ Start ------------------------ */
  boot();

})();
