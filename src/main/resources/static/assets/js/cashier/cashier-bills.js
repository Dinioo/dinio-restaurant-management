document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const fmtMoney = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";
  const fmtDT = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const pad2 = (x) => String(x).padStart(2, "0");
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const toast = {
    success: (msg) => (window.successToast ? window.successToast(msg) : console.log(msg)),
    error: (msg) => (window.errorToast ? window.errorToast(msg) : console.error(msg)),
    warning: (msg) => (window.warningToast ? window.warningToast(msg) : console.warn(msg)),
    info: (msg) => (window.infoToast ? window.infoToast(msg) : console.log(msg)),
  };

  const openModal = (id) => {
    const m = el(id);
    if (!m) return;
    m.classList.remove("is-hidden");
    m.setAttribute("aria-hidden", "false");
  };

  const closeModal = (id) => {
    const m = el(id);
    if (!m) return;
    m.classList.add("is-hidden");
    m.setAttribute("aria-hidden", "true");
  };

  const bindModalClose = (id) => {
    const m = el(id);
    if (!m) return;

    m.addEventListener("click", (e) => {
      if (e.target.closest("[data-close='1']")) closeModal(id);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal(id);
    });
  };

  const ui = {
    date: el("cblDate"),
    q: el("q"),
    payType: el("payType"),
    preType: el("preType"),
    tbody: el("tbody"),
    footHint: el("footHint"),
    pageInfo: el("pageInfo"),
    prevPage: el("prevPage"),
    nextPage: el("nextPage"),
    vbConfirm: el("vbConfirmBtn"),
    vbCancel: el("vbCancelBtn"),
  };

  const state = {
    page: 1,
    pageSize: 8,
    all: [],
    filtered: [],
    pendingVoidId: null,
  };

  async function fetchBillsPaidByDate(dateYmd) {
    const base = new Date(dateYmd + "T12:00:00");
    const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    const names = ["Anh Minh", "Chị Hân", "Anh Long", "Chị Vy", "", "", "Khách đặt"];
    const pays = ["CASH", "BANK", "VISA"];

    return Array.from({ length: 38 }, (_, i) => {
      const mins = rnd(0, 60 * 12);
      const t = new Date(base.getTime() - mins * 60 * 1000).toISOString();
      const total = rnd(90000, 1850000);
      const customerName = names[rnd(0, names.length - 1)];
      const payType = pays[rnd(0, pays.length - 1)];
      const isPreorder = rnd(0, 1) === 1;

      return {
        id: "B" + String(100000 + i),
        paidAt: t,
        total,
        customerName,
        payType,
        isPreorder,
      };
    }).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  }

  function applyFilter() {
    const q = (ui.q.value || "").trim().toLowerCase();
    const pay = ui.payType.value || "";
    const pre = ui.preType.value || "";

    let arr = [...state.all];

    if (pay) arr = arr.filter((x) => x.payType === pay);
    if (pre === "PRE") arr = arr.filter((x) => x.isPreorder === true);
    if (pre === "WALKIN") arr = arr.filter((x) => x.isPreorder === false);

    if (q) {
      arr = arr.filter((x) => {
        const name = (x.customerName && x.customerName.trim()) ? x.customerName.trim() : "Khách lẻ";
        return name.toLowerCase().includes(q);
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

    ui.tbody.innerHTML = slice.map((x, idx) => {
      const stt = start + idx + 1;
      const name = (x.customerName && x.customerName.trim()) ? x.customerName.trim() : "Khách lẻ";
      return `
        <tr data-id="${x.id}">
          <td class="ta-c"><strong>${stt}</strong></td>
          <td>${fmtDT(x.paidAt)}</td>
          <td class="ta-c"><strong>${fmtMoney(x.total)}</strong></td>
          <td>${name}</td>
          <td class="ta-c">
            <div class="cbl-actions-cell">
              <button class="btn-save" data-action="view" type="button">Xem</button>
              <button class="btn-cancel" data-action="void" type="button">Void</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    ui.pageInfo.textContent = `${state.page} / ${totalPages}`;
    ui.footHint.textContent = `Hiển thị ${slice.length} / ${arr.length} bill`;
    ui.prevPage.disabled = state.page <= 1;
    ui.nextPage.disabled = state.page >= totalPages;
  }

  async function load() {
    const ymd = ui.date.value || new Date().toISOString().slice(0, 10);
    ui.date.value = ymd;

    try {
      state.all = await fetchBillsPaidByDate(ymd);
      applyFilter();
      render();
      toast.info("Đã tải danh sách bill");
    } catch (e) {
      toast.error("Không tải được danh sách bill");
      console.error(e);
    }
  }

  bindModalClose("vbModal");

  ui.date.addEventListener("change", load);
  ui.q.addEventListener("input", () => { applyFilter(); render(); });
  ui.payType.addEventListener("change", () => { applyFilter(); render(); });
  ui.preType.addEventListener("change", () => { applyFilter(); render(); });

  ui.prevPage.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });

  ui.nextPage.addEventListener("click", () => {
    state.page = state.page + 1;
    render();
  });

  ui.tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr?.dataset?.id;
    const action = btn.dataset.action;

    if (!id) return;

    if (action === "view") {
      window.location.href = `/dinio/cashier/bills/view?id=${encodeURIComponent(id)}`;
      return;
    }

    if (action === "void") {
      state.pendingVoidId = id;
      openModal("vbModal");
    }
  });

  ui.vbCancel?.addEventListener("click", () => {
    state.pendingVoidId = null;
    closeModal("vbModal");
    toast.info("Đã huỷ thao tác void");
  });

  ui.vbConfirm?.addEventListener("click", async () => {
    if (!state.pendingVoidId) return;

    toast.warning(`Đang void bill ${state.pendingVoidId}`);

    try {
      toast.success(`Đã void bill ${state.pendingVoidId}`);
      state.pendingVoidId = null;
      closeModal("vbModal");
      await load();
    } catch (e) {
      toast.error("Void thất bại");
      console.error(e);
    }
  });

  load();
});
