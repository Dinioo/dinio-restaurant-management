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

const state = {
  q: "",
  station: "all",
  type: "all",
  sound: false,
  selectedId: null,
  items: [
    { id: "a1", name: "Gỏi cuốn", table: "Bàn 7", qty: 3, station: "cold", type: "takeaway", note: "Ít rau", status: "NEW", createdAt: Date.now() - 8 * 60 * 1000, tags: ["Mang đi"] },
    { id: "a2", name: "Phở bò tái", table: "Bàn 12", qty: 2, station: "hot", type: "priority", note: "Ít hành", status: "NEW", createdAt: Date.now() - 3 * 60 * 1000, tags: ["Ưu tiên"] },
    { id: "b1", name: "Cơm gà xối mỡ", table: "Bàn 9", qty: 1, station: "hot", type: "all", note: "Không cay", status: "COOKING", createdAt: Date.now() - 15 * 60 * 1000, tags: [] },
    { id: "b2", name: "Trà đào", table: "Bàn 3", qty: 2, station: "bar", type: "vip", note: "Ít đá", status: "COOKING", createdAt: Date.now() - 11 * 60 * 1000, tags: ["VIP"] },
    { id: "c1", name: "Bánh flan", table: "Bàn 5", qty: 2, station: "cold", type: "vip", note: "", status: "READY", createdAt: Date.now() - 21 * 60 * 1000, tags: ["VIP"] }
  ]
};

function fmtStation(st) {
  if (st === "hot") return "Bếp nóng";
  if (st === "cold") return "Bếp nguội";
  if (st === "bar") return "Bar";
  return "—";
}

function fmtAge(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  return `${m}m`;
}

function ageClass(mins) {
  if (mins >= 20) return "danger";
  if (mins >= 12) return "warn";
  return "ok";
}

function stationPill(st) {
  if (st === "hot") return { cls: "hot", label: "HOT" };
  if (st === "cold") return { cls: "cold", label: "COLD" };
  return { cls: "bar", label: "BAR" };
}

function typeLabel(t) {
  if (t === "priority") return "Ưu tiên";
  if (t === "takeaway") return "Mang đi";
  if (t === "vip") return "VIP";
  return "";
}

function statusLabel(s) {
  if (s === "NEW") return "Mới vào";
  if (s === "COOKING") return "Đang làm";
  if (s === "READY") return "Sẵn sàng";
  return s || "—";
}

function matchesFilters(it) {
  const q = state.q.trim().toLowerCase();
  const hay = `${it.name} ${it.note || ""} ${typeLabel(it.type)} ${fmtStation(it.station)} ${statusLabel(it.status)}`.toLowerCase();
  if (q && !hay.includes(q)) return false;
  if (state.station !== "all" && it.station !== state.station) return false;
  if (state.type !== "all" && it.type !== state.type) return false;
  return true;
}

function renderCard(it) {
  const mins = Math.round((Date.now() - it.createdAt) / 60000);
  const acls = ageClass(mins);
  const pill = stationPill(it.station);

  const note = (it.note || "").trim();
  const extraLine = note ? `<div class="kextra">${note}</div>` : "";

  return `
    <div class="kcard" data-id="${it.id}" role="button" tabindex="0">
      <div class="krow">
        <p class="kname">${it.name}</p>
        <span class="kage ${acls}">${fmtAge(Date.now() - it.createdAt)}</span>
      </div>

      <div class="ksub">
        <span class="kpill ${pill.cls}">${pill.label}</span>
      </div>

      ${extraLine}

      <div class="kactions">
        <button class="btn-light" data-action="detail" type="button">Chi tiết</button>
        <button class="btn-order" data-action="next" type="button">Next</button>
      </div>
    </div>
  `;
}

function updateCounts() {
  const cols = ["NEW", "COOKING", "READY"];
  cols.forEach((c) => {
    const count = state.items.filter((it) => it.status === c && matchesFilters(it)).length;

    const el = $(`#count${c}`);
    if (el) el.textContent = String(count);

    const empty = $(`#empty${c}`);
    if (empty) empty.style.display = count === 0 ? "grid" : "none";
  });
}

function renderBoard() {
  const colNEW = $("#colNEW");
  const colCOOKING = $("#colCOOKING");
  const colREADY = $("#colREADY");
  if (!colNEW || !colCOOKING || !colREADY) return;

  colNEW.innerHTML = "";
  colCOOKING.innerHTML = "";
  colREADY.innerHTML = "";

  state.items
    .filter(matchesFilters)
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((it) => {
      const html = renderCard(it);
      if (it.status === "NEW") colNEW.insertAdjacentHTML("beforeend", html);
      if (it.status === "COOKING") colCOOKING.insertAdjacentHTML("beforeend", html);
      if (it.status === "READY") colREADY.insertAdjacentHTML("beforeend", html);
    });

  updateCounts();
}

function nextStatus(it) {
  if (it.status === "NEW") it.status = "COOKING";
  else if (it.status === "COOKING") it.status = "READY";
  else it.status = "READY";
}

function getSelectedItem() {
  if (!state.selectedId) return null;
  return state.items.find((x) => x.id === state.selectedId) || null;
}

function openModal(it) {
  state.selectedId = it.id;

  const modal = $("#kdModal");
  if (!modal) return;

  const kdTitle = $("#kdTitle");
  const kdSub = $("#kdSub");
  const kdStation = $("#kdStation");
  const kdAge = $("#kdAge");
  const kdStatus = $("#kdStatus");
  const kdId = $("#kdId");
  const kdNote = $("#kdNote");

  if (kdTitle) kdTitle.textContent = it.name || "Chi tiết món";
  if (kdSub) kdSub.textContent = "Thông tin món";

  if (kdStation) kdStation.textContent = fmtStation(it.station);

  const mins = Math.round((Date.now() - it.createdAt) / 60000);
  if (kdAge) kdAge.textContent = `${mins} phút`;

  if (kdStatus) kdStatus.textContent = statusLabel(it.status);
  if (kdId) kdId.textContent = it.id || "—";

  const note = (it.note || "").trim() || "—";
  if (kdNote) kdNote.textContent = note;

  modal.classList.remove("is-hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = $("#kdModal");
  if (modal) {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  state.selectedId = null;
}

function bindChips(rootId, key) {
  const root = $(`#${rootId}`);
  if (!root) return;

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    $$("#" + rootId + " .chip").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    state[key] = btn.dataset[key] || "all";
    renderBoard();
  });
}

function initSearch() {
  const input = $("#q");
  const clear = $("#btnClear");
  if (!input || !clear) return;

  const syncClear = () => {
    clear.style.display = input.value.trim() ? "inline-flex" : "none";
  };

  input.addEventListener("input", () => {
    state.q = input.value;
    syncClear();
    renderBoard();
  });

  clear.addEventListener("click", () => {
    input.value = "";
    state.q = "";
    syncClear();
    input.focus();
    renderBoard();
  });

  syncClear();
}

function initActions() {
  const btnSound = $("#btnSound");
  const btnFullscreen = $("#btnFullscreen");
  const btnRefresh = $("#btnRefresh");

  if (btnSound) {
    btnSound.addEventListener("click", () => {
      state.sound = !state.sound;
      btnSound.classList.toggle("is-on", state.sound);
      showToast(state.sound ? "Bật âm báo" : "Tắt âm báo", "info");
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch {
        showToast("Trình duyệt không hỗ trợ fullscreen", "warning");
      }
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      renderBoard();
      showToast("Đã làm mới", "success");
    });
  }
}

function initBoardEvents() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".kcard");
    if (!card) return;

    const id = card.dataset.id;
    const it = state.items.find((x) => x.id === id);
    if (!it) return;

    const actionBtn = e.target.closest("button[data-action]");
    if (actionBtn) {
      const act = actionBtn.dataset.action;
      if (act === "detail") openModal(it);
      if (act === "next") {
        nextStatus(it);
        renderBoard();
        showToast("Đã chuyển trạng thái", "success");
      }
      return;
    }

    openModal(it);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  const modal = $("#kdModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close='1']")) closeModal();
    });
  }

  const kdNext = $("#kdNext");
  if (kdNext) {
    kdNext.addEventListener("click", () => {
      const it = getSelectedItem();
      if (!it) return;

      nextStatus(it);
      renderBoard();
      openModal(it);
      showToast("Đã chuyển trạng thái", "success");
    });
  }
}

function initAutoAgeTick() {
  const tick = () => {
    $$(".kcard").forEach((card) => {
      const id = card.dataset.id;
      const it = state.items.find((x) => x.id === id);
      if (!it) return;

      const mins = Math.round((Date.now() - it.createdAt) / 60000);
      const badge = card.querySelector(".kage");
      if (!badge) return;

      badge.textContent = fmtAge(Date.now() - it.createdAt);
      badge.classList.remove("ok", "warn", "danger");
      badge.classList.add(ageClass(mins));
    });

    updateCounts();
  };

  tick();
  setInterval(tick, 15000);
}

document.addEventListener("DOMContentLoaded", () => {
  bindChips("stationChips", "station");
  bindChips("typeChips", "type");
  initSearch();
  initActions();
  initBoardEvents();
  renderBoard();
  initAutoAgeTick();
});
