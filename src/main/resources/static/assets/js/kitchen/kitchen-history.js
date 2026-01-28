const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function showToast(message, type = "info", duration = 2200) {
  if (typeof Toastify !== "function") 
    return;
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

const state = {
  q: "",
  station: "all",
  range: "today",
  items: [] 
};

const STATION_RULES = {
  "Starters": "cold",
  "Main":      "hot",
  "Desserts":  "hot",
  "Drinks":    "bar"
};

function fmtStation(st) {
  if (st === "hot") 
    return { label: "HOT", cls: "hot" };
  if (st === "cold") 
    return { label: "COLD", cls: "cold" };
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
  if (state.range === "30m") 
    return now - readyAt <= 30 * 60 * 1000;
  if (state.range === "2h") 
    return now - readyAt <= 2 * 60 * 60 * 1000;

  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return readyAt >= start && readyAt <= now;
}

function matches(it) {
  if (state.station !== "all" && it.station !== state.station) 
    return false;
  if (!withinRange(it.readyAt)) 
    return false;

  const q = state.q.trim().toLowerCase();
  if (!q) 
    return true;

  const hay = `${it.name} ${it.note || ""}`.toLowerCase();
  return hay.includes(q);
}

async function fetchHistoryData() {
  try {
    const res = await fetch('/dinio/api/kitchen/items');
    const data = await res.json();
    
    state.items = data
      .filter(it => it.status === "SERVED" || it.status === "READY")
      .map(it => {
        return {
          ...it,
          station: STATION_RULES[it.categoryName] || "hot",
          receivedAt: new Date(it.createdAt).getTime(),
          readyAt: Date.now() 
        };
      });
    
    render();
  } catch (e) { 
    console.error("Lỗi fetch lịch sử:", e);
    showToast("Không thể tải dữ liệu lịch sử", "error");
  }
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
  if (el) 
    el.textContent = `${n} món`;
}

function render() {
  const rows = $("#hRows");
  const empty = $("#hEmpty");
  if (!rows || !empty) 
    return;

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
  if (!root) 
    return;

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) 
      return;
    setActiveChip(root, ".chip");
    btn.classList.add("is-active");
    state.station = btn.dataset.station || "all";
    render();
  });
}

function bindRangeChips() {
  const root = $("#hRange");
  if (!root) 
    return;

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) 
      return;
    setActiveChip(root, ".chip");
    btn.classList.add("is-active");
    state.range = btn.dataset.range || "today";
    render();
  });
}

function bindSearch() {
  const input = $("#hq");
  if (!input) 
    return;

  input.addEventListener("input", () => {
    state.q = input.value || "";
    render();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindSearch();
  bindStationChips();
  bindRangeChips();
  fetchHistoryData(); 
  
  setInterval(fetchHistoryData, 60000);
});