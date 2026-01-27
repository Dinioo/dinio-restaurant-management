const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function showToast(message, type = "info", duration = 2200) {
  if (typeof Toastify !== "function") return;
  Toastify({
    text: message,
    duration,
    gravity: "top",
    position: "right",
    close: true,
    className: type,
    stopOnFocus: true
  }).showToast();
}

const STORAGE_KEY = "dinio_kitchen_history_v1";

const state = {
  q: "",
  station: "all",
  range: "today",
  items: []
};

function fmtStation(st) {
  if (st === "hot") return { label: "HOT", cls: "hot" };
  if (st === "cold") return { label: "COLD", cls: "cold" };
  return { label: "BAR", cls: "bar" };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtHM(ts) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtDate(ts) {
  const d = new Date(ts);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${fmtHM(ts)}`;
}

function minsBetween(a, b) {
  return Math.max(0, Math.round((b - a) / 60000));
}

function withinRange(readyAt) {
  const now = Date.now();
  if (state.range === "30m") return now - readyAt <= 30 * 60 * 1000;
  if (state.range === "2h") return now - readyAt <= 2 * 60 * 60 * 1000;

  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return readyAt >= start && readyAt <= now;
}

function matches(it) {
  if (state.station !== "all" && it.station !== state.station) return false;
  if (!withinRange(it.readyAt)) return false;

  const q = state.q.trim().toLowerCase();
  if (!q) return true;

  const hay = `${it.name} ${it.note || ""}`.toLowerCase();
  return hay.includes(q);
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    state.items = Array.isArray(arr) ? arr : [];
  } catch {
    state.items = [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  } catch {}
}

function clearHistory() {
  state.items = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function renderRow(it) {
  const st = fmtStation(it.station);
  const recv = it.receivedAt ? fmtDate(it.receivedAt) : "—";
  const ready = fmtDate(it.readyAt);
  const dur = it.receivedAt ? `${minsBetween(it.receivedAt, it.readyAt)}m` : "—";
  const note = (it.note || "").trim() || "—";

  return `
    <div class="kh-tr kh-row" role="row">
      <div class="kh-cell kh-dish" role="cell" title="${it.name}">${it.name}</div>
      <div class="kh-cell kh-note" role="cell" title="${note}">${note}</div>
      <div class="kh-cell" role="cell"><span class="kh-pill ${st.cls}">${st.label}</span></div>
      <div class="kh-cell kh-time" role="cell">${recv}</div>
      <div class="kh-cell kh-time" role="cell">${ready}</div>
      <div class="kh-cell kh-dur" role="cell">${dur}</div>
    </div>
  `;
}

function updateCount(n) {
  const el = $("#hCount");
  if (el) el.textContent = `${n} món`;
}

function render() {
  const rows = $("#hRows");
  const empty = $("#hEmpty");
  if (!rows || !empty) return;

  const list = state.items
    .filter(matches)
    .sort((a, b) => b.readyAt - a.readyAt);

  rows.innerHTML = list.map(renderRow).join("");
  updateCount(list.length);
  empty.style.display = list.length ? "none" : "flex";
}

function setActiveChip(root, selectorBtn) {
  $$(selectorBtn, root).forEach(b => b.classList.remove("is-active"));
}

function bindStationChips() {
  const root = $("#hStation");
  if (!root) return;

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    setActiveChip(root, ".chip");
    btn.classList.add("is-active");
    state.station = btn.dataset.station || "all";
    render();
  });
}

function bindRangeChips() {
  const root = $("#hRange");
  if (!root) return;

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    setActiveChip(root, ".chip");
    btn.classList.add("is-active");
    state.range = btn.dataset.range || "today";
    render();
  });
}

function bindSearch() {
  const input = $("#hq");
  if (!input) return;

  input.addEventListener("input", () => {
    state.q = input.value || "";
    render();
  });
}

function bindClear() {
  const btn = $("#btnClear");
  if (!btn) return;

  btn.addEventListener("click", () => {
    clearHistory();
    render();
    showToast("Đã xoá lịch sử (local)", "success");
  });
}

function seedIfEmpty() {
  if (state.items.length) return;

  const now = Date.now();
  state.items = [
    { id: "h1", name: "Cơm gà xối mỡ", note: "Không cay", station: "hot", receivedAt: now - 22 * 60000, readyAt: now - 10 * 60000 },
    { id: "h2", name: "Trà đào", note: "Ít đá", station: "bar", receivedAt: now - 18 * 60000, readyAt: now - 6 * 60000 },
    { id: "h3", name: "Bánh flan", note: "", station: "cold", receivedAt: now - 35 * 60000, readyAt: now - 20 * 60000 }
  ];
  saveHistory();
}

document.addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY) return;
  loadHistory();
  render();
});

document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  seedIfEmpty();
  bindSearch();
  bindStationChips();
  bindRangeChips();
  bindClear();
  render();
});

window.KitchenHistory = {
  add(item) {
    const now = Date.now();
    const rec = {
      id: item.id || `h_${now}_${Math.random().toString(16).slice(2)}`,
      name: item.name || "—",
      note: (item.note || "").trim(),
      station: item.station || "hot",
      receivedAt: item.receivedAt || null,
      readyAt: item.readyAt || now
    };
    state.items = [rec, ...state.items].slice(0, 500);
    saveHistory();
    render();
  }
};
