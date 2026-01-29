document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const toast = {
    success: (msg) => (window.successToast ? window.successToast(msg) : console.log(msg)),
    error: (msg) => (window.errorToast ? window.errorToast(msg) : console.error(msg)),
    warning: (msg) => (window.warningToast ? window.warningToast(msg) : console.warn(msg)),
    info: (msg) => (window.infoToast ? window.infoToast(msg) : console.log(msg)),
  };

  const ui = {
    q: el("q"),
    date: el("date"),
    slot: el("slot"),
    party: el("party"),
    list: el("list"),
    footHint: el("footHint"),
    pageInfo: el("pageInfo"),
    prevPage: el("prevPage"),
    nextPage: el("nextPage"),
  };

  const state = {
    page: 1,
    pageSize: 5,
    all: [],
    filtered: [],
  };

  const pad2 = (x) => String(x).padStart(2, "0");

  const fmtDT = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const slotLabel = (s) => (s === "MORNING" ? "Ca sáng" : s === "EVENING" ? "Ca chiều" : "—");

  const areaLabel = (a) => {
    if (a === "F1") return "Tầng 1";
    if (a === "F2") return "Tầng 2";
    if (a === "F3") return "Tầng 3";
    if (a === "VIP") return "VIP";
    if (a === "OUTDOOR") return "Outdoor";
    return "—";
  };

  const partyBucket = (n) => {
    if (n === 2) return "2";
    if (n === 3) return "3";
    if (n === 4) return "4";
    if (n === 6) return "6";
    return "7+";
  };

  async function fetchWaitingConfirm(dateYmd) {
    const base = new Date(dateYmd + "T12:00:00");
    const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    const names = ["Anh Minh", "Chị Hân", "Chị Vy", "Anh Long", "Khách đặt"];
    const phones = ["0901 234 567", "0987 111 222", "0912 888 999", "0933 444 555"];
    const slots = ["MORNING", "EVENING"];
    const areas = ["F1", "F2", "F3", "VIP", "OUTDOOR"];
    const partyChoices = [2, 3, 4, 6, 7, 8, 9];
    const tableIds = ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "T11", "T12"];

    return Array.from({ length: 26 }, () => {
      const mins = rnd(0, 60 * 10);
      const time = new Date(base.getTime() + mins * 60 * 1000).toISOString();
      const name = names[rnd(0, names.length - 1)];
      const phone = phones[rnd(0, phones.length - 1)];
      const slot = slots[rnd(0, slots.length - 1)];
      const area = areas[rnd(0, areas.length - 1)];
      const partySize = partyChoices[rnd(0, partyChoices.length - 1)];
      const tableId = tableIds[rnd(0, tableIds.length - 1)];
      const note = rnd(0, 4) === 0 ? "Gần cửa sổ" : "";
      return { time, slot, area, partySize, name, phone, tableId, note };
    }).sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  function applyFilter() {
    const q = (ui.q.value || "").trim().toLowerCase();
    const slot = ui.slot.value || "";
    const party = ui.party.value || "";

    let arr = [...state.all];

    if (slot) arr = arr.filter((x) => x.slot === slot);

    if (party === "2") arr = arr.filter((x) => partyBucket(x.partySize) === "2");
    if (party === "3") arr = arr.filter((x) => partyBucket(x.partySize) === "3");
    if (party === "4") arr = arr.filter((x) => partyBucket(x.partySize) === "4");
    if (party === "6") arr = arr.filter((x) => partyBucket(x.partySize) === "6");
    if (party === "7+") arr = arr.filter((x) => partyBucket(x.partySize) === "7+");

    if (q) {
      arr = arr.filter((x) => {
        const name = (x.name || "").toLowerCase();
        const phone = (x.phone || "").toLowerCase();
        const tableId = (x.tableId || "").toLowerCase();
        const area = areaLabel(x.area).toLowerCase();
        return `${name} ${phone} ${tableId} ${area}`.includes(q);
      });
    }

    state.filtered = arr;
    state.page = 1;
  }

  function render() {
    const arr = state.filtered;
    const totalPages = Math.max(1, Math.ceil(arr.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * state.pageSize;
    const slice = arr.slice(start, start + state.pageSize);

    ui.list.innerHTML = slice
      .map((x) => {
        const name = x.name || "Khách đặt";
        const phone = x.phone || "—";
        const party = partyBucket(x.partySize);
        const tableId = x.tableId || "—";
        const area = areaLabel(x.area);

        return `
          <article class="cwc-item" data-table="${tableId}">
            <div class="cwc-left">
              <div class="cwc-title">
                <div class="cwc-name">${name}</div>
                <div class="cwc-code">${area}</div>
              </div>
              <div class="cwc-sub">
                <span>${phone}</span>
                <span class="cwc-dot">•</span>
                <span>${party} khách</span>
                <span class="cwc-dot">•</span>
                <span>Bàn ${tableId}</span>
                ${x.note ? `<span class="cwc-dot">•</span><span>${x.note}</span>` : ``}
              </div>
            </div>

            <div class="cwc-mid">
              <div class="cwc-meta">
                <span class="cwc-pill">${slotLabel(x.slot)}</span>
                <span class="cwc-pill">${fmtDT(x.time)}</span>
              </div>
            </div>

            <div class="cwc-actions-cell">
              <button class="btn-save" type="button" data-action="confirm">Xác nhận</button>
              <button class="btn-cancel" type="button" data-action="reject">Từ chối</button>
              <button class="btn-light" type="button" data-action="view">Xem chi tiết</button>
            </div>
          </article>
        `;
      })
      .join("");

    ui.pageInfo.textContent = `${state.page} / ${totalPages}`;
    ui.footHint.textContent = `Hiển thị ${slice.length} / ${arr.length} đặt bàn`;
    ui.prevPage.disabled = state.page <= 1;
    ui.nextPage.disabled = state.page >= totalPages;
  }

  async function load() {
    const ymd = ui.date.value || new Date().toISOString().slice(0, 10);
    ui.date.value = ymd;

    try {
      state.all = await fetchWaitingConfirm(ymd);
      applyFilter();
      render();
      toast.info("Đã tải danh sách bàn chờ xác nhận");
    } catch (e) {
      toast.error("Không tải được dữ liệu");
      console.error(e);
    }
  }

  function disableItem(item) {
    item.style.opacity = ".55";
    item.querySelectorAll("button").forEach((b) => (b.disabled = true));
  }

  ui.q.addEventListener("input", () => {
    applyFilter();
    render();
  });

  ui.slot.addEventListener("change", () => {
    applyFilter();
    render();
  });

  ui.party.addEventListener("change", () => {
    applyFilter();
    render();
  });

  ui.date.addEventListener("change", load);

  ui.prevPage.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });

  ui.nextPage.addEventListener("click", () => {
    state.page = state.page + 1;
    render();
  });

  ui.list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const item = btn.closest(".cwc-item");
    const tableId = item?.dataset?.table || "";
    const action = btn.dataset.action;

    if (!item) return;

    if (action === "view") {
      toast.info(`Xem chi tiết bàn ${tableId}`);
      return;
    }

    if (action === "confirm") {
      toast.success(`Đã xác nhận bàn ${tableId}`);
      disableItem(item);
      return;
    }

    if (action === "reject") {
      toast.warning(`Đã từ chối bàn ${tableId}`);
      disableItem(item);
    }
  });

  load();
});
