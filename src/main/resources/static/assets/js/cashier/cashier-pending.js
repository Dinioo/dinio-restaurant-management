document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

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

  const getHeaders = () => {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const header = document.querySelector('meta[name="_csrf_header"]')?.content;
  const headers = { 'Content-Type': 'application/json' };

  if (token && header) {
    headers[header] = token;
  }
  return headers;
};

  const state = {
    page: 1,
    pageSize: 5,
    all: [],
    filtered: [],
  };

  const pad2 = (x) => String(x).padStart(2, "0");
  
  const fmtDT = (iso) => {
    if (!iso) 
      return "—";
    const d = new Date(iso);
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const getSlot = (iso) => {
    const d = new Date(iso);
    return d.getHours() < 15 ? "MORNING" : "EVENING";
  };
  const slotLabel = (s) => (s === "MORNING" ? "Ca sáng" : "Ca chiều");

  async function fetchReservations(dateYmd) {
    try {
      const response = await fetch(`/dinio/api/cashier/reservations?date=${dateYmd}`);
      if (!response.ok) 
        throw new Error("Fetch failed");
      return await response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async function updateStatus(id, action) {
    const endpoint = action === "confirm" ? "confirm" : "reject";
    try {
      const response = await fetch(`/dinio/api/cashier/reservations/${id}/${endpoint}`, {
        method: 'POST',
        headers: getHeaders() 
      });
      return response.ok;
    } catch (e) {
      console.error("Lỗi cập nhật trạng thái:", e);
      return false;
    }
  }

  function applyFilter() {
    const q = (ui.q.value || "").trim().toLowerCase();
    const slot = ui.slot.value || "";
    const party = ui.party.value || "";

    let arr = [...state.all];

    if (slot) 
      arr = arr.filter((x) => getSlot(x.reservedAt) === slot);

    if (party === "1-2") 
      arr = arr.filter((x) => x.partySize <= 2);
    if (party === "3-4") 
      arr = arr.filter((x) => x.partySize >= 3 && x.partySize <= 4);
    if (party === "5+") 
      arr = arr.filter((x) => x.partySize >= 5);

    if (q) {
      arr = arr.filter((x) => {
        const name = (x.customer?.fullName || "").toLowerCase();
        const phone = (x.customer?.phone || "").toLowerCase();
        const code = (x.table?.code || "").toLowerCase();
        const area = (x.area?.name || "").toLowerCase();
        return `${name} ${phone} ${code} ${area}`.includes(q);
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
        const slot = getSlot(x.reservedAt);
        const status = x.status;

        let actionButtons = "";
        if (status === "PENDING") {
          actionButtons = `
            <button class="btn-save" type="button" data-action="confirm">Xác nhận</button>
            <button class="btn-cancel" type="button" data-action="reject">Từ chối</button>
            <button class="btn-light" type="button" data-action="view">Xem chi tiết</button>
          `;
        } else if (status === "CONFIRMED") {
          actionButtons = `
            <button class="btn-save" type="button" disabled>Đã xác nhận</button>
            <button class="btn-light" type="button" data-action="view">Xem chi tiết</button>
          `;
        } else if (status === "CANCELLED") {
          actionButtons = `
            <button class="btn-cancel" type="button" disabled>Đã từ chối</button>
            <button class="btn-light" type="button" data-action="view">Xem chi tiết</button>
          `;
        }

        return `
          <article class="cwc-item" data-id="${x.id}">
            <div class="cwc-left">
              <div class="cwc-title">
                <div class="cwc-name">${x.customer?.fullName || "Khách vãng lai"}</div>
                <div class="cwc-code">Khu vực: ${x.area?.name || "—"}</div>
              </div>
              <div class="cwc-sub">
                <span>SĐT: ${x.customer?.phone || "—"}</span>
                <span class="cwc-dot">•</span>
                <span>${x.partySize} khách</span>
                <span class="cwc-dot">•</span>
                <span style="font-weight: 600; color: var(--primary)">Bàn: ${x.table?.code || "—"}</span>
                ${x.note ? `<span class="cwc-dot">•</span><span class="cwc-note-text">Lưu ý: ${x.note}</span>` : ``}
              </div>
            </div>

            <div class="cwc-mid">
              <div class="cwc-meta">
                <span class="cwc-pill">${slotLabel(slot)}</span>
                <span class="cwc-pill">${fmtDT(x.reservedAt)}</span>
              </div>
            </div>

            <div class="cwc-actions-cell">
              ${actionButtons}
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
      state.all = await fetchReservations(ymd);
      applyFilter();
      render();
    } catch (e) {
      errorToast("Không tải được dữ liệu bàn chờ xác nhận");
    }
  }

  ui.list.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn || btn.disabled) return;

    const item = btn.closest(".cwc-item");
    const id = item?.dataset?.id;
    const action = btn.dataset.action;

    if (action === "view") {
      infoToast("Tính năng xem chi tiết đang được phát triển");
      return;
    }

    if (action === "confirm") {
      const ok = await updateStatus(id, "confirm");
      if (ok) {
        successToast("Đã xác nhận bàn đặt thành công");
        load(); 
      } else {
        errorToast("Xác nhận thất bại, vui lòng thử lại");
      }
    }

    if (action === "reject") {
      const ok = await updateStatus(id, "reject");
      
      if (ok) {
        warningToast("Đã từ chối bàn và hủy các món ăn đặt trước");
        load(); 
      } else {
        errorToast("Từ chối thất bại, vui lòng kiểm tra lại");
      }
    }
  });

  ui.q.addEventListener("input", () => { applyFilter(); render(); });
  ui.slot.addEventListener("change", () => { applyFilter(); render(); });
  ui.party.addEventListener("change", () => { applyFilter(); render(); });
  ui.date.addEventListener("change", load);
  ui.prevPage.addEventListener("click", () => { if (state.page > 1) { state.page--; render(); } });
  ui.nextPage.addEventListener("click", () => { state.page++; render(); });

  load();
});