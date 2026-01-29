
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);

  const el = {
    areas: $("#tmAreas"),

    floor: $("#wtFloor"),
    billFilter: $("#wtBillFilter"),
    query: $("#wtQuery"),

    refresh: $("#btnRefresh"),

    pickTable: $("#pickTable"),
    pickArea: $("#pickArea"),
    pickStatus: $("#pickStatus"),
    pickBillState: $("#pickBillState"),
    pickGuest: $("#pickGuest"),
    pickRes: $("#pickRes"),

    btnOpenBill: $("#btnOpenBill"),
    btnPay: $("#btnPay"),
    btnResConfirm: $("#btnResConfirm"),
    btnResCancel: $("#btnResCancel")
  };

  const state = {
    tables: [],
    areas: [],
    pickId: null,
    _qTimer: null
  };

  const MOCK = {
    areas: [
      { code: "floor1", name: "Tầng 1" },
      { code: "floor2", name: "Tầng 2" },
      { code: "vip", name: "VIP" }
    ],
    tables: [
      { id: "T01", name: "Bàn 01", areaCode: "floor1", areaName: "Tầng 1", floorCode: "floor1", seats: 2, guestCount: 0, status: "IDLE", billState: "NO_ITEMS" },
      { id: "T02", name: "Bàn 02", areaCode: "floor1", areaName: "Tầng 1", floorCode: "floor1", seats: 4, guestCount: 3, status: "SEATED", billState: "WAIT_BILL" },
      { id: "T03", name: "Bàn 03", areaCode: "floor1", areaName: "Tầng 1", floorCode: "floor1", seats: 6, guestCount: 2, status: "CLOSED", billState: "WAIT_PAY" },

      {
        id: "T11", name: "Bàn 11", areaCode: "floor2", areaName: "Tầng 2", floorCode: "floor2", seats: 2, guestCount: 0, status: "IDLE", billState: "NO_ITEMS",
        reservation: { id: "R001", status: "PENDING", time: "19:00", customerName: "An", phone: "0909xxxxxx" }
      },
      { id: "T12", name: "Bàn 12", areaCode: "floor2", areaName: "Tầng 2", floorCode: "floor2", seats: 8, guestCount: 4, status: "SEATED", billState: "WAIT_BILL" },

      {
        id: "V01", name: "VIP 01", areaCode: "vip", areaName: "VIP", floorCode: "vip", seats: 10, guestCount: 6, status: "CLOSED", billState: "WAIT_PAY",
        reservation: { id: "R002", status: "CONFIRMED", time: "20:00", customerName: "Bình", phone: "0987xxxxxx" }
      }
    ]
  };

  function toast(text) {
    if (window.infoToast) return window.infoToast(text);
    Toastify({ text, duration: 2200, gravity: "top", position: "right" }).showToast();
  }

  function normText(v) {
    return (v ?? "").toString().trim().toLowerCase();
  }

  function billStateOf(t) {
    const s = (t.billState || "").toString().toUpperCase();
    if (s === "NO_ITEMS" || s === "WAIT_BILL" || s === "WAIT_PAY") return s;
    return "NO_ITEMS";
  }

  function billStateLabel(bs) {
    if (bs === "WAIT_BILL") return "Đợi tính bill";
    if (bs === "WAIT_PAY") return "Chờ thanh toán";
    return "Chưa phát sinh món";
  }

  function tableBadgeClass(bs) {
    if (bs === "WAIT_BILL") return "is-waitbill";
    if (bs === "WAIT_PAY") return "is-waitpay";
    return "is-noitems";
  }

  function findTable(id) {
    return state.tables.find((t) => t.id === id) || null;
  }

  function setTextSafe(node, text) {
    if (!node) return;
    node.textContent = text;
  }

  function setDisabledSafe(node, disabled) {
    if (!node) return;
    node.disabled = !!disabled;
  }

  function renderTableCard(t) {
    const bs = billStateOf(t);

    const div = document.createElement("button");
    div.type = "button";
    div.className = `tm-table ${tableBadgeClass(bs)} ${state.pickId === t.id ? "is-selected" : ""}`;
    div.dataset.id = t.id;
    div.dataset.floor = t.floorCode || "";
    div.dataset.area = t.areaCode || "";

    const name = document.createElement("div");
    name.className = "tm-table-name";
    name.textContent = t.name;

    const seats = document.createElement("div");
    seats.className = "tm-table-seats";
    seats.textContent = `${t.seats ?? t.capacity ?? 0} chỗ`;

    div.appendChild(name);
    div.appendChild(seats);

    div.addEventListener("click", () => pickTable(t.id));
    return div;
  }

  function renderAreas(areas) {
    if (!el.areas) return;
    el.areas.innerHTML = "";

    areas.forEach((a) => {
      const sec = document.createElement("section");
      sec.className = "tm-area";

      const head = document.createElement("div");
      head.className = "tm-area-head";

      const title = document.createElement("h4");
      title.className = "tm-area-title";
      title.textContent = a.name;

      head.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "tm-grid";

      sec.appendChild(head);
      sec.appendChild(grid);
      el.areas.appendChild(sec);

      (a.tables || []).forEach((t) => grid.appendChild(renderTableCard(t)));
    });
  }

  function buildAreas(filteredTables) {
    const by = new Map();
    filteredTables.forEach((t) => {
      const key = t.areaCode || "OTHER";
      if (!by.has(key)) by.set(key, []);
      by.get(key).push(t);
    });

    const out = [];
    state.areas.forEach((a) => {
      const tables = by.get(a.code) || [];
      if (tables.length) out.push({ ...a, tables });
    });

    by.forEach((tables, key) => {
      const exists = out.some((x) => x.code === key);
      if (!exists) out.push({ code: key, name: key, tables });
    });

    return out;
  }

  function syncPickPanel() {
    const t = findTable(state.pickId);

    if (!t) {
      setTextSafe(el.pickTable, "—");
      setTextSafe(el.pickArea, "—");
      setTextSafe(el.pickStatus, "—");
      setTextSafe(el.pickBillState, "—");
      setTextSafe(el.pickGuest, "—");
      setTextSafe(el.pickRes, "—");
      setDisabledSafe(el.btnOpenBill, true);
      setDisabledSafe(el.btnPay, true);
      setDisabledSafe(el.btnResConfirm, true);
      setDisabledSafe(el.btnResCancel, true);
      return;
    }

    const bs = billStateOf(t);
    const res = t.reservation || null;
    const resStatus = (res?.status || "").toUpperCase();
    const resNeedAction = !!res && (resStatus === "PENDING" || resStatus === "REQUESTED" || resStatus === "NEW");

    setTextSafe(el.pickTable, t.name);
    setTextSafe(el.pickArea, t.areaName || "—");
    setTextSafe(el.pickStatus, t.status || "—");
    setTextSafe(el.pickBillState, billStateLabel(bs));
    setTextSafe(el.pickGuest, `${t.guestCount ?? "—"} / ${t.seats ?? t.capacity ?? "—"} chỗ`);
    setTextSafe(el.pickRes, res ? `${resStatus}${res.time ? ` • ${res.time}` : ""}` : "—");

    setDisabledSafe(el.btnOpenBill, !(bs === "WAIT_BILL" || bs === "WAIT_PAY"));
    setDisabledSafe(el.btnPay, !(bs === "WAIT_BILL" || bs === "WAIT_PAY"));
    setDisabledSafe(el.btnResConfirm, !resNeedAction);
    setDisabledSafe(el.btnResCancel, !resNeedAction);
  }

  function applyFilters() {
    const floor = el.floor ? el.floor.value : "all";
    const bill = el.billFilter ? el.billFilter.value : "all";
    const q = el.query ? normText(el.query.value) : "";

    let list = state.tables.slice();

    if (floor !== "all") {
      list = list.filter((t) => (t.floorCode || "").toLowerCase() === floor.toLowerCase());
    }

    if (bill !== "all") {
      list = list.filter((t) => billStateOf(t) === bill);
    }

    if (q) {
      list = list.filter((t) => {
        const hay = [
          t.name, t.id, t.areaName, t.floorCode,
          t.reservation?.customerName, t.reservation?.phone
        ].map(normText).join(" | ");
        return hay.includes(q);
      });
    }

    renderAreas(buildAreas(list));
    syncPickPanel();

    document.querySelectorAll(".tm-table.is-selected").forEach((x) => x.classList.remove("is-selected"));
    if (state.pickId) {
      document.querySelectorAll(`[data-id="${CSS.escape(state.pickId)}"]`).forEach((x) => {
        if (x.classList.contains("tm-table")) x.classList.add("is-selected");
      });
    }
  }

  function pickTable(id) {
    state.pickId = id;
    applyFilters();
  }

  function resConfirmMock() {
    const t = findTable(state.pickId);
    if (!t?.reservation) return;
    t.reservation.status = "CONFIRMED";
    toast("Đã xác nhận đặt bàn (mock)");
    applyFilters();
  }

  function resCancelMock() {
    const t = findTable(state.pickId);
    if (!t?.reservation) return;
    t.reservation.status = "CANCELLED";
    toast("Đã huỷ đặt bàn (mock)");
    applyFilters();
  }

  if (el.floor) el.floor.addEventListener("change", applyFilters);
  if (el.billFilter) el.billFilter.addEventListener("change", applyFilters);

  if (el.query) {
    el.query.addEventListener("input", () => {
      clearTimeout(state._qTimer);
      state._qTimer = setTimeout(applyFilters, 120);
    });
  }

  if (el.refresh) {
    el.refresh.addEventListener("click", () => {
      state.tables = MOCK.tables.map((x) => ({ ...x, reservation: x.reservation ? { ...x.reservation } : null }));
      state.areas = MOCK.areas.map((x) => ({ ...x }));
      toast("Refresh (mock)");
      applyFilters();
    });
  }

  if (el.btnResConfirm) el.btnResConfirm.addEventListener("click", resConfirmMock);
  if (el.btnResCancel) el.btnResCancel.addEventListener("click", resCancelMock);

  if (el.btnOpenBill) el.btnOpenBill.addEventListener("click", () => toast("FE mock: Open bill"));
  if (el.btnPay) el.btnPay.addEventListener("click", () => toast("FE mock: Pay"));

  state.tables = MOCK.tables.map((x) => ({ ...x, reservation: x.reservation ? { ...x.reservation } : null }));
  state.areas = MOCK.areas.map((x) => ({ ...x }));
  applyFilters();
});
