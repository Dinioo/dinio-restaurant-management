document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const ui = {
    q: el("q"),
    date: el("cblDate"),
    payType: el("payType"),
    preType: el("preType"),
    tbody: el("tbody"),
    footHint: el("footHint"),
    pageInfo: el("pageInfo"),
    prevPage: el("prevPage"),
    nextPage: el("nextPage"),

    vbModal: el("vbModal"),
    vbConfirmBtn: el("vbConfirmBtn"),
    vbCancelBtn: el("vbCancelBtn"),
  };

  const state = {
    page: 1,
    pageSize: 8,
    all: [],
    filtered: [],
    pendingVoidId: null,
  };

  const fmtMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

  const fmtDT = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const pad2 = (x) => String(x).padStart(2, "0");
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  async function load() {
    const ymd = ui.date?.value || new Date().toISOString().slice(0, 10);
    if (ui.date) ui.date.value = ymd;

    try {
      const response = await fetch(`/dinio/api/cashier/bills?date=${ymd}`);
      if (!response.ok) throw new Error("Fetch failed");
      state.all = await response.json();
      applyFilter();
    } catch (e) {
      console.error(e);
      if (window.errorToast) window.errorToast("Không tải được dữ liệu hóa đơn");
    }
  }

  function applyFilter() {
    const q = (ui.q?.value || "").trim().toLowerCase();
    const pay = ui.payType?.value || "";
    const pre = ui.preType?.value || "";

    let arr = [...state.all];

    if (pay) arr = arr.filter((x) => x.payType === pay);
    if (pre === "PRE") arr = arr.filter((x) => x.isPreorder === true);
    if (pre === "WALKIN") arr = arr.filter((x) => x.isPreorder === false);

    if (q) {
      arr = arr.filter((x) =>
        (x.customerName || "").toLowerCase().includes(q)
      );
    }

    state.filtered = arr;
    state.page = 1;
    render();
  }

  function render() {
    if (!ui.tbody) return;
    const arr = state.filtered;
    const totalPages = Math.max(1, Math.ceil(arr.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * state.pageSize;
    const slice = arr.slice(start, start + state.pageSize);

    ui.tbody.innerHTML = slice.map((x, idx) => {
      const stt = start + idx + 1;
      return `
        <tr data-id="${x.id}">
          <td class="ta-c"><strong>${stt}</strong></td>
          <td>${fmtDT(x.paidAt)}</td>
          <td class="ta-r" style="font-weight:600; color:var(--primary)">${fmtMoney(x.amount)}</td>
          <td>${x.customerName}</td>
          <td class="ta-c">
            <div class="cbl-btns">
              <button class="btn-light" type="button" data-action="view">Xem</button>
              <button class="btn-cancel" type="button" data-action="void">Xoá</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    if (ui.pageInfo) ui.pageInfo.textContent = `${state.page} / ${totalPages}`;
    if (ui.footHint) ui.footHint.textContent = `Tổng cộng: ${arr.length} hóa đơn`;
    if (ui.prevPage) ui.prevPage.disabled = state.page <= 1;
    if (ui.nextPage) ui.nextPage.disabled = state.page >= totalPages;
  }

  ui.date?.addEventListener("change", load);
  ui.q?.addEventListener("input", applyFilter);
  ui.payType?.addEventListener("change", applyFilter);
  ui.preType?.addEventListener("change", applyFilter);

  ui.prevPage?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });

  ui.nextPage?.addEventListener("click", () => {
    state.page++;
    render();
  });

  ui.tbody?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr.dataset.id;
    const action = btn.dataset.action;

    if (action === "view") {
      window.location.href = `/dinio/cashier/bills/view?id=${id}`;
    }

    if (action === "void") {
      state.pendingVoidId = id;
      ui.vbModal?.classList.remove("is-hidden");
    }
  });

  ui.vbCancelBtn?.addEventListener("click", () => {
    ui.vbModal?.classList.add("is-hidden");
    state.pendingVoidId = null;
  });

  ui.vbConfirmBtn?.addEventListener("click", async () => {
    if (!state.pendingVoidId) return;

    try {
      const response = await fetch(`/dinio/api/cashier/bills/${state.pendingVoidId}/void`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        state.all = state.all.filter(x => String(x.id) !== String(state.pendingVoidId));
        applyFilter();

        if (window.successToast) window.successToast("Đã xóa hóa đơn vĩnh viễn khỏi hệ thống");
      } else {
        const errData = await response.json();
        if (window.errorToast) window.errorToast(errData.message || "Xóa thất bại");
      }
    } catch (e) {
      console.error("Lỗi xóa:", e);
      if (window.errorToast) window.errorToast("Lỗi kết nối máy chủ");
    } finally {
      ui.vbModal?.classList.add("is-hidden");
      state.pendingVoidId = null;
    }
  });

  load();
});