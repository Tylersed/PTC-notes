/* PTC Notes Vault — localStorage notes + premium UI + Word export (.doc)
   No login. No password bar. GitHub Pages safe. */

const STORE_KEY = "ptc_notes_vault_v1";
const UI_KEY = "ptc_notes_vault_ui_v1";

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const nowISO = () => new Date().toISOString();

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function stripHtmlToText(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || div.innerText || "").trim();
}

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function toast(type, title, msg) {
  const host = $("#toasts");
  const el = document.createElement("div");
  el.className = `toast ${type || ""}`.trim();
  el.innerHTML = `
    <div class="toastTitle">${escapeHtml(title || "Notice")}</div>
    <div class="toastMsg">${escapeHtml(msg || "")}</div>
  `;
  host.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ---------- Data ---------- */

function defaultNote() {
  return {
    id: uid(),
    title: "Untitled note",
    tags: [],
    pinned: false,
    starred: false,
    bodyHtml: "",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { notes: [welcomeNote()], selectedId: null };
    const parsed = JSON.parse(raw);
    if (!parsed?.notes?.length) return { notes: [welcomeNote()], selectedId: null };
    return parsed;
  } catch {
    return { notes: [welcomeNote()], selectedId: null };
  }
}

function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function welcomeNote() {
  const n = defaultNote();
  n.title = "Welcome to PTC Notes Vault";
  n.tags = ["ptc", "notes"];
  n.pinned = true;
  n.bodyHtml = `
    <p><b>Local-only notes</b> — everything saves in your browser automatically.</p>
    <ul>
      <li><b>New</b> note: Ctrl/⌘ + N</li>
      <li><b>Command palette</b>: Ctrl/⌘ + K</li>
      <li><b>Export</b> selected note to Word (.doc)</li>
      <li><b>Backup</b> / <b>Import</b> JSON for moving to a new computer</li>
    </ul>
    <p>Tip: Use tags to group notes (comma separated).</p>
  `.trim();
  return n;
}

/* ---------- UI State ---------- */

let state = loadState();
let ui = loadUI();
let selectedId = state.selectedId || (state.notes[0]?.id ?? null);

function loadUI() {
  try {
    const raw = localStorage.getItem(UI_KEY);
    return raw ? JSON.parse(raw) : { filter: "all", search: "" };
  } catch {
    return { filter: "all", search: "" };
  }
}

function saveUI() {
  localStorage.setItem(UI_KEY, JSON.stringify(ui));
}

/* ---------- Elements ---------- */

const elList = $("#noteList");
const elSearch = $("#search");
const elClearSearch = $("#btnClearSearch");
const elTitle = $("#noteTitle");
const elTags = $("#noteTags");
const elTagChips = $("#tagChips");
const elBody = $("#noteBody");

const elMetaCount = $("#metaCount");
const elStatusLeft = $("#statusLeft");
const elStatusRight = $("#statusRight");

const btnNew = $("#btnNew");
const btnExportWord = $("#btnExportWord");
const btnExportAllWord = $("#btnExportAllWord");
const btnExportBackup = $("#btnExportBackup");
const fileImport = $("#fileImport");
const btnReset = $("#btnReset");
const btnCmd = $("#btnCmd");

const btnPin = $("#btnPin");
const btnStar = $("#btnStar");
const btnDup = $("#btnDup");
const btnDel = $("#btnDel");
const btnClean = $("#btnClean");

/* Command palette */
const cmdOverlay = $("#cmdOverlay");
const cmdInput = $("#cmdInput");
const cmdList = $("#cmdList");
const cmdClose = $("#cmdClose");

let cmdIndex = 0;

/* ---------- Helpers ---------- */

function getSelected() {
  return state.notes.find(n => n.id === selectedId) || null;
}

function setSelected(id) {
  selectedId = id;
  state.selectedId = id;
  persist();
  renderAll();
  focusEditorSoft();
}

function persist() {
  saveState(state);
}

const persistDebounced = debounce(() => {
  state.selectedId = selectedId;
  persist();
  setStatus("Saved", true);
}, 350);

function setStatus(text, ok = true) {
  elStatusLeft.textContent = text;
  elStatusRight.textContent = ok ? "Autosave on" : "Check";
}

function focusEditorSoft() {
  // Keep UX smooth: focus title if empty, else body
  const n = getSelected();
  if (!n) return;
  if (!n.title || n.title.trim() === "" || n.title === "Untitled note") {
    elTitle.focus();
    elTitle.select();
  }
}

/* ---------- Rendering ---------- */

function filteredNotes() {
  const q = (ui.search || "").trim().toLowerCase();

  let notes = [...state.notes];

  // Filter tabs
  if (ui.filter === "pinned") notes = notes.filter(n => n.pinned);
  if (ui.filter === "starred") notes = notes.filter(n => n.starred);

  // Search
  if (q) {
    notes = notes.filter(n => {
      const t = (n.title || "").toLowerCase();
      const tags = (n.tags || []).join(",").toLowerCase();
      const body = stripHtmlToText(n.bodyHtml).toLowerCase();
      return t.includes(q) || tags.includes(q) || body.includes(q);
    });
  }

  // Sort: pinned first, then updated
  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return notes;
}

function renderList() {
  const notes = filteredNotes();
  elList.innerHTML = "";

  for (const n of notes) {
    const div = document.createElement("div");
    div.className = `card ${n.id === selectedId ? "active" : ""}`.trim();

    const snippet = stripHtmlToText(n.bodyHtml).slice(0, 110);
    const badges = `
      ${n.pinned ? `<span class="badge pin">📌</span>` : ""}
      ${n.starred ? `<span class="badge star">✦</span>` : ""}
    `;

    div.innerHTML = `
      <div class="cardTop">
        <div class="cardTitle">${escapeHtml(n.title || "Untitled note")}</div>
        <div class="badges">${badges}</div>
      </div>
      <div class="cardMeta">
        <span>${escapeHtml((n.tags || []).slice(0,3).join(", ")) || "—"}</span>
        <span>${escapeHtml(formatWhen(n.updatedAt))}</span>
      </div>
      <div class="cardSnippet">${escapeHtml(snippet || "…")}</div>
    `;

    div.addEventListener("click", () => setSelected(n.id));
    elList.appendChild(div);
  }

  elMetaCount.textContent = `${state.notes.length} note${state.notes.length === 1 ? "" : "s"}`;
}

function renderEditor() {
  const n = getSelected();
  if (!n) return;

  elTitle.value = n.title || "";
  elTags.value = (n.tags || []).join(", ");

  // Update buttons
  btnPin.textContent = n.pinned ? "📌 Pinned" : "📌 Pin";
  btnStar.textContent = n.starred ? "✦ Starred" : "✦ Star";

  // Body (avoid resetting caret while typing)
  const current = elBody.innerHTML;
  if (current !== (n.bodyHtml || "")) {
    elBody.innerHTML = n.bodyHtml || "";
  }

  renderChips(n.tags || []);
}

function renderChips(tags) {
  elTagChips.innerHTML = "";
  for (const t of tags) {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = t;
    elTagChips.appendChild(chip);
  }
}

function renderSeg() {
  $$(".segBtn").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === ui.filter);
  });
}

function renderAll() {
  // Ensure selected exists
  if (!state.notes.some(n => n.id === selectedId)) {
    selectedId = state.notes[0]?.id ?? null;
    state.selectedId = selectedId;
    persist();
  }

  renderSeg();
  renderList();
  renderEditor();
}

/* ---------- Mutations ---------- */

function updateSelected(patch) {
  const n = getSelected();
  if (!n) return;

  Object.assign(n, patch);
  n.updatedAt = nowISO();
  persistDebounced();
  renderList(); // keep list fresh
}

function createNote() {
  const n = defaultNote();
  state.notes.unshift(n);
  setSelected(n.id);
  toast("ok", "New note", "Created");
}

function deleteSelected() {
  const n = getSelected();
  if (!n) return;

  const ok = confirm(`Delete "${n.title}"?\n\nThis removes it from this browser.`);
  if (!ok) return;

  state.notes = state.notes.filter(x => x.id !== n.id);
  selectedId = state.notes[0]?.id ?? null;
  state.selectedId = selectedId;
  persist();
  renderAll();
  toast("bad", "Deleted", "Note removed");
}

function duplicateSelected() {
  const n = getSelected();
  if (!n) return;

  const copy = {
    ...structuredClone(n),
    id: uid(),
    title: `${n.title || "Untitled"} (Copy)`,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  state.notes.unshift(copy);
  setSelected(copy.id);
  toast("ok", "Duplicated", "Copy created");
}

function parseTags(raw) {
  return (raw || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 18);
}

/* ---------- Export / Import ---------- */

function buildWordDocHtml(title, notes) {
  const safeTitle = escapeHtml(title || "PTC Notes");
  const bodyBlocks = notes.map(n => {
    const tags = (n.tags || []).map(t => `<span style="display:inline-block;border:1px solid rgba(0,0,0,.15);padding:3px 8px;border-radius:999px;margin-right:6px;font-size:12px;color:#111;">${escapeHtml(t)}</span>`).join("");
    const when = escapeHtml(formatWhen(n.updatedAt));
    return `
      <div style="margin: 0 0 18px 0; padding: 14px; border: 1px solid rgba(0,0,0,.10); border-radius: 14px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${escapeHtml(n.title || "Untitled note")}</div>
        <div style="font-size:12px;color:#444;margin-bottom:10px;">
          <span style="margin-right:12px;">Updated: ${when}</span>
          ${n.pinned ? "<span style='margin-right:8px;'>📌 Pinned</span>" : ""}
          ${n.starred ? "<span>✦ Starred</span>" : ""}
        </div>
        <div style="margin-bottom:10px;">${tags || ""}</div>
        <div style="font-size:14px;line-height:1.55;color:#111;">${n.bodyHtml || "<i>(empty)</i>"}</div>
      </div>
    `;
  }).join("");

  // MS Word-compatible HTML wrapper (.doc)
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family: Calibri, Arial, sans-serif; background:#fff; padding: 18px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:22px;font-weight:800;">${safeTitle}</div>
          <div style="font-size:12px;color:#444;margin-top:4px;">Exported from PTC Notes Vault • ${escapeHtml(new Date().toLocaleString())}</div>
        </div>
        ${bodyBlocks || "<i>No notes.</i>"}
      </body>
    </html>
  `.trim();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportSelectedToWord() {
  const n = getSelected();
  if (!n) return;
  const html = buildWordDocHtml(n.title || "PTC Note", [n]);
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const file = `${(n.title || "ptc-note").replace(/[\\/:*?"<>|]+/g,"-")}.doc`;
  downloadBlob(blob, file);
  toast("ok", "Exported", "Word document downloaded");
}

function exportAllToWord() {
  const notes = [...state.notes].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const html = buildWordDocHtml("PTC Notes Export", notes);
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  downloadBlob(blob, `PTC-Notes-${new Date().toISOString().slice(0,10)}.doc`);
  toast("ok", "Exported", "All notes exported to Word");
}

function exportBackupJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  downloadBlob(blob, `PTC-Notes-Backup-${new Date().toISOString().slice(0,10)}.json`);
  toast("ok", "Backup created", "JSON downloaded");
}

async function importBackupJson(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed?.notes || !Array.isArray(parsed.notes)) {
      toast("bad", "Import failed", "Invalid backup format");
      return;
    }

    const mode = confirm("Import mode:\n\nOK = Merge with existing notes\nCancel = Replace everything");
    if (mode) {
      // Merge by id, prefer imported values
      const map = new Map(state.notes.map(n => [n.id, n]));
      for (const n of parsed.notes) map.set(n.id, n);
      state.notes = Array.from(map.values());
      toast("ok", "Imported", "Merged backup into vault");
    } else {
      state = parsed;
      toast("ok", "Imported", "Replaced vault from backup");
    }

    // Ensure selection exists
    selectedId = state.selectedId || state.notes[0]?.id || null;
    state.selectedId = selectedId;

    persist();
    renderAll();
  } catch {
    toast("bad", "Import failed", "Could not read that JSON file");
  } finally {
    fileImport.value = "";
  }
}

/* ---------- Command Palette ---------- */

const commands = [
  { key: "new", title: "New note", desc: "Create a new note", run: createNote },
  { key: "export", title: "Export selected to Word", desc: "Download .doc for the selected note", run: exportSelectedToWord },
  { key: "export all", title: "Export all to Word", desc: "Download .doc for all notes", run: exportAllToWord },
  { key: "backup", title: "Export JSON backup", desc: "Download a JSON backup file", run: exportBackupJson },
  { key: "reset", title: "Reset vault", desc: "Clear all local notes (danger)", run: () => btnReset.click() },
  { key: "pin", title: "Toggle pin", desc: "Pin/unpin selected note", run: () => btnPin.click() },
  { key: "star", title: "Toggle star", desc: "Star/unstar selected note", run: () => btnStar.click() },
  { key: "duplicate", title: "Duplicate note", desc: "Create a copy of the selected note", run: duplicateSelected },
  { key: "delete", title: "Delete note", desc: "Remove the selected note (danger)", run: deleteSelected },
];

function openCmd() {
  cmdOverlay.classList.add("open");
  cmdOverlay.setAttribute("aria-hidden", "false");
  cmdInput.value = "";
  cmdIndex = 0;
  renderCmdList();
  setTimeout(() => cmdInput.focus(), 0);
}

function closeCmd() {
  cmdOverlay.classList.remove("open");
  cmdOverlay.setAttribute("aria-hidden", "true");
}

function renderCmdList() {
  const q = cmdInput.value.trim().toLowerCase();
  const items = commands.filter(c =>
    !q || c.key.includes(q) || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
  );

  cmdIndex = Math.max(0, Math.min(cmdIndex, items.length - 1));

  cmdList.innerHTML = "";
  items.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = `cmdItem ${i === cmdIndex ? "active" : ""}`.trim();
    div.innerHTML = `
      <div class="cmdItemTitle">${escapeHtml(c.title)}</div>
      <div class="cmdItemDesc">${escapeHtml(c.desc)}</div>
    `;
    div.addEventListener("click", () => { closeCmd(); c.run(); });
    cmdList.appendChild(div);
  });

  if (!items.length) {
    const div = document.createElement("div");
    div.className = "cmdItem active";
    div.innerHTML = `<div class="cmdItemTitle">No matches</div><div class="cmdItemDesc">Try: new, export, backup, reset</div>`;
    cmdList.appendChild(div);
  }

  // stash current filtered list for enter handling
  cmdList._items = items;
}

/* ---------- RTE (Rich Text) ---------- */

function execCmd(cmd) {
  document.execCommand(cmd, false, null);
  elBody.focus();
}

function cleanFormatting() {
  // Simple, safe cleanup: remove style attributes, keep basic HTML structure
  const html = elBody.innerHTML || "";
  const div = document.createElement("div");
  div.innerHTML = html;

  div.querySelectorAll("*").forEach(node => {
    node.removeAttribute("style");
    node.removeAttribute("class");
    node.removeAttribute("id");
  });

  elBody.innerHTML = div.innerHTML;
  updateSelected({ bodyHtml: elBody.innerHTML });
  toast("ok", "Cleaned", "Formatting normalized");
}

/* ---------- Events ---------- */

function wire() {
  // restore UI
  elSearch.value = ui.search || "";
  renderAll();

  // tabs
  $$(".segBtn").forEach(b => {
    b.addEventListener("click", () => {
      ui.filter = b.dataset.filter;
      saveUI();
      renderSeg();
      renderList();
      toast("ok", "Filter", ui.filter.toUpperCase());
    });
  });

  // search
  elSearch.addEventListener("input", () => {
    ui.search = elSearch.value;
    saveUI();
    renderList();
  });
  elClearSearch.addEventListener("click", () => {
    elSearch.value = "";
    ui.search = "";
    saveUI();
    renderList();
    elSearch.focus();
  });

  // new
  btnNew.addEventListener("click", createNote);

  // export
  btnExportWord.addEventListener("click", exportSelectedToWord);
  btnExportAllWord.addEventListener("click", exportAllToWord);

  // backup + import
  btnExportBackup.addEventListener("click", exportBackupJson);
  fileImport.addEventListener("change", (e) => importBackupJson(e.target.files?.[0]));

  // reset
  btnReset.addEventListener("click", () => {
    const ok = confirm("Reset vault?\n\nThis clears ALL notes stored in THIS browser.");
    if (!ok) return;
    localStorage.removeItem(STORE_KEY);
    state = loadState();
    selectedId = state.notes[0]?.id ?? null;
    state.selectedId = selectedId;
    persist();
    renderAll();
    toast("bad", "Reset", "Local vault cleared");
  });

  // editor fields
  elTitle.addEventListener("input", () => {
    updateSelected({ title: elTitle.value.trim() || "Untitled note" });
  });

  elTags.addEventListener("input", () => {
    const tags = parseTags(elTags.value);
    updateSelected({ tags });
    renderChips(tags);
  });

  elBody.addEventListener("input", () => {
    updateSelected({ bodyHtml: elBody.innerHTML });
  });

  // Pin / Star / Duplicate / Delete
  btnPin.addEventListener("click", () => {
    const n = getSelected(); if (!n) return;
    updateSelected({ pinned: !n.pinned });
    renderEditor();
    toast("ok", "Pin", n.pinned ? "Unpinned" : "Pinned");
  });

  btnStar.addEventListener("click", () => {
    const n = getSelected(); if (!n) return;
    updateSelected({ starred: !n.starred });
    renderEditor();
    toast("ok", "Star", n.starred ? "Unstarred" : "Starred");
  });

  btnDup.addEventListener("click", duplicateSelected);
  btnDel.addEventListener("click", deleteSelected);

  // Rich text toolbar
  $$(".rteBtn[data-cmd]").forEach(b => {
    b.addEventListener("click", () => execCmd(b.dataset.cmd));
  });
  btnClean.addEventListener("click", cleanFormatting);

  // Command palette
  btnCmd.addEventListener("click", openCmd);
  cmdClose.addEventListener("click", closeCmd);
  cmdOverlay.addEventListener("click", (e) => { if (e.target === cmdOverlay) closeCmd(); });
  cmdInput.addEventListener("input", () => { cmdIndex = 0; renderCmdList(); });

  cmdInput.addEventListener("keydown", (e) => {
    const items = cmdList._items || [];
    if (e.key === "Escape") { e.preventDefault(); closeCmd(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); cmdIndex = Math.min(cmdIndex + 1, Math.max(0, items.length - 1)); renderCmdList(); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); cmdIndex = Math.max(cmdIndex - 1, 0); renderCmdList(); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = items[cmdIndex];
      if (c) { closeCmd(); c.run(); }
    }
  });

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); openCmd(); return; }
    if (mod && e.key.toLowerCase() === "n") { e.preventDefault(); createNote(); return; }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); persist(); toast("ok", "Saved", "Vault saved"); return; }
    if (e.key === "Escape" && cmdOverlay.classList.contains("open")) { e.preventDefault(); closeCmd(); return; }
  });

  setStatus("Ready", true);
}

/* ---------- Boot ---------- */
wire();
