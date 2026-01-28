const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const KDS_RULES = {
  "Starters": { station: "cold", time: 10 },
  "Main": { station: "hot", time: 20 },
  "Desserts": { station: "hot", time: 15 },
  "Drinks": { station: "bar", time: 5 }
};

const getHeaders = () => {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;
  const headers = { 'Content-Type': 'application/json' };

  if (token && header) {
    headers[header] = token;
  }
  return headers;
};


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
  type: "all",
  sound: false,
  selectedId: null,
  items: []
};

function fmtStation(st) {
  if (st === "hot") 
    return "Bếp nóng";
  if (st === "cold") 
    return "Bếp nguội";
  if (st === "bar") 
    return "Bar";
  return "—";
}

function fmtAge(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  return `${m}m`;
}

function ageClass(mins) {
  if (mins >= 20) 
    return "danger";
  if (mins >= 12) 
    return "warn";
  return "ok";
}

function stationPill(st) {
  if (st === "hot") 
    return { cls: "hot", label: "HOT" };
  if (st === "cold") 
    return { cls: "cold", label: "COLD" };
  return { cls: "bar", label: "BAR" };
}

function statusLabel(s) {
  if (s === "NEW") 
    return "Mới vào";
  if (s === "COOKING") 
    return "Đang làm";
  if (s === "READY") 
    return "Sẵn sàng";
  return s || "—";
}

function matchesFilters(it) {
  if (it.status === "SERVED") 
    return false;
  const q = state.q.trim().toLowerCase();
  const hay = `${it.name} ${it.note || ""} ${fmtStation(it.station)} ${statusLabel(it.status)}`.toLowerCase();
  if (q && !hay.includes(q)) 
    return false;
  if (state.station !== "all" && it.station !== state.station) 
    return false;
  return true;
}


async function fetchKdsData() {
  try {
    const res = await fetch('/dinio/api/kitchen/items');
    const data = await res.json();

    state.items = data.filter(it => it.status !== "SERVED")
      .map(it => { const rule = KDS_RULES[it.categoryName] || { station: "hot", time: 15 };
      return {
        ...it,
        table: it.tableCode,
        station: rule.station,
        targetTime: rule.time,
        createdAt: new Date(it.createdAt).getTime(),
        status: it.status === "QUEUED" ? "NEW" : (it.status === "PREPARING" ? "COOKING" : "READY")
      };
    });
    renderBoard();
  } catch (e) { console.error("Lỗi fetch:", e); }
}

async function handleNextStatus(it) {
  try {
    const res = await fetch(`/dinio/api/kitchen/items/${it.id}/next`, {
      method: 'POST',
      headers: getHeaders()
    });
    const result = await res.json();

    if (result.status === "SERVED") {
      showToast(`Món ${it.name} đã được phục vụ`, "success");
      closeModal();
    } else {
      showToast("Đã chuyển trạng thái", "success");
    }
    await fetchKdsData();
  } catch (e) { showToast("Lỗi hệ thống", "error"); }
}


function renderCard(it) {
  const mins = Math.round((Date.now() - it.createdAt) / 60000);
  const acls = ageClass(mins);
  const pill = stationPill(it.station);

  const remaining = Math.max(0, it.targetTime - mins);
  const urgent = (remaining <= 2 && it.status !== "READY") ? "kcard-urgent" : "";

  const note = (it.note || "").trim();
  const extraLine = note ? `<div class="kextra"><i class="fa-solid fa-pen"></i> ${note}</div>` : "";

  return `
    <div class="kcard ${urgent}" data-id="${it.id}" role="button" tabindex="0">
      <div class="krow">
        <p class="kname">${it.name}</p>
        <span class="kage ${acls}">${remaining}</span>
      </div>

      <div class="ksub">
        <span class="kpill ${pill.cls}">${pill.label}</span>
        <span class="ktable-tag">${it.table}</span>
      </div>

      ${extraLine}
      
      <div class="ktime-info" style="margin-top:8px; font-size:12px; opacity:0.8; display:flex; justify-content:space-between;">
         <span>Target: ${it.targetTime}m</span>
         <span>Đã làm: <strong>${fmtAge(Date.now() - it.createdAt)}m</strong></span>
      </div>

      <div class="kactions">
        <button class="btn-light" data-action="detail" type="button">Chi tiết</button>
        <button class="btn-order" data-action="next" type="button">Next</button>
      </div>
    </div>
  `;
}


function renderBoard() {
  const colNEW = $("#colNEW");
  const colCOOKING = $("#colCOOKING");
  const colREADY = $("#colREADY");
  if (!colNEW || !colCOOKING || !colREADY) 
    return;

  colNEW.innerHTML = ""; colCOOKING.innerHTML = ""; colREADY.innerHTML = "";

  state.items
    .filter(matchesFilters)
    .filter(it => it.status !== "SERVED") 
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((it) => {
      const html = renderCard(it);
      if (it.status === "NEW") 
        colNEW.insertAdjacentHTML("beforeend", html);
      if (it.status === "COOKING") 
        colCOOKING.insertAdjacentHTML("beforeend", html);
      if (it.status === "READY") 
        colREADY.insertAdjacentHTML("beforeend", html);
    });

  updateCounts();
}

function updateCounts() {
  const cols = ["NEW", "COOKING", "READY"];
  cols.forEach((c) => {
    const count = state.items.filter((it) => 
      it.status === c && 
      it.status !== "SERVED" && 
      matchesFilters(it)
    ).length;

    if ($(`#count${c}`)) 
      $(`#count${c}`).textContent = String(count);
    if ($(`#empty${c}`))
      $(`#empty${c}`).style.display = count === 0 ? "grid" : "none";
  });
}

function getSelectedItem() {
  return state.items.find((x) => x.id == state.selectedId) || null;
}

function openModal(it) {
  state.selectedId = it.id;
  const modal = $("#kdModal");
  if (!modal) 
    return;

  const kdTitle = $("#kdTitle");
  const kdSub = $("#kdSub");
  const kdStation = $("#kdStation");
  const kdAge = $("#kdAge");
  const kdStatus = $("#kdStatus");
  const kdId = $("#kdId");
  const kdNote = $("#kdNote");
  const kdQty = $("#kdQty");


  if (kdTitle) 
    kdTitle.textContent = it.name || "Chi tiết món";
  if (kdSub) 
    kdSub.textContent = `Bàn: ${it.table || it.tableCode || "—"}`;

  if (kdStation) 
    kdStation.textContent = fmtStation(it.station);

  if (kdAge) 
    kdAge.textContent = fmtAge(Date.now() - it.createdAt);

  if (kdStatus) 
    kdStatus.textContent = statusLabel(it.status);

  if (kdId) 
    kdId.textContent = it.id;
  if (kdNote) 
    kdNote.textContent = it.note || "—";

  if (kdQty) 
    kdQty.textContent = it.qty || "1";

  modal.classList.remove("is-hidden");
}

function closeModal() {
  const modal = $("#kdModal");
  if (modal) {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  state.selectedId = null;
}

function initBoardEvents() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".kcard");
    if (!card) 
      return;

    const it = state.items.find((x) => x.id == card.dataset.id);
    if (!it) 
      return;

    const actionBtn = e.target.closest("button[data-action]");
    if (actionBtn) {
      const act = actionBtn.dataset.action;
      if (act === "detail") 
        openModal(it);
      if (act === "next") 
        handleNextStatus(it);
      return;
    }
    openModal(it);
  });

  $("#kdNext")?.addEventListener("click", () => {
    const it = getSelectedItem();
    if (it) 
      handleNextStatus(it);
  });

  const modal = $("#kdModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close='1']")) 
        closeModal();
    });
  }
}


function bindChips(rootId, key) {
  const root = $(`#${rootId}`);
  if (!root) 
    return;
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) 
      return;
    $$("#" + rootId + " .chip").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    state[key] = btn.dataset[key] || "all";
    renderBoard();
  });
}

function initSearch() {
  const input = $("#q");
  if (!input) 
    return;
  input.addEventListener("input", () => {
    state.q = input.value;
    renderBoard();
  });
}

function initAutoAgeTick() {
  setInterval(() => {
    renderBoard();
  }, 15000);
}

document.addEventListener("DOMContentLoaded", () => {
  bindChips("stationChips", "station");
  initSearch();
  initBoardEvents();
  fetchKdsData();
  initAutoAgeTick();
  setInterval(fetchKdsData, 30000);
});