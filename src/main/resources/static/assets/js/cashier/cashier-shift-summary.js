document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);
  const fmt = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";
  const fmtNum = (n) => (Number(n || 0)).toLocaleString("vi-VN");
  const pad2 = (n) => String(n).padStart(2, "0");
  const setText = (node, v) => { if (node) node.textContent = v; };

  const ui = {
    date: el("csuDate"),
    tabs: Array.from(document.querySelectorAll(".csu-tab")),
    metaTime: el("metaTime"),
    metaCashier: el("metaCashier"),
    metaBills: el("metaBills"),
    metaRevenue: el("metaRevenue"),
    metaDiff: el("metaDiff"),

    pillStatus: el("pillStatus"),

    kpiNet: el("kpiNet"),
    kpiNetSub: el("kpiNetSub"),
    kpiCash: el("kpiCash"),
    kpiCashSub: el("kpiCashSub"),
    kpiBank: el("kpiBank"),
    kpiBankSub: el("kpiBankSub"),
    kpiVisa: el("kpiVisa"),
    kpiVisaSub: el("kpiVisaSub"),

    miniPaid: el("miniPaid"),
    miniCancel: el("miniCancel"),
    miniTables: el("miniTables"),

    rcOpen: el("rcOpen"),
    rcCashIn: el("rcCashIn"),
    rcCashOut: el("rcCashOut"),
    rcExpected: el("rcExpected"),
    rcActual: el("rcActual"),
    rcDiff: el("rcDiff"),
    rcDiffRow: el("rcDiffRow"),

    topCount: el("topCount"),
    topList: el("topList"),

    billSearch: el("billSearch"),
    billFilter: el("billFilter"),
    billTbody: el("billTbody"),
    billFootLeft: el("billFootLeft"),
    billFootRight: el("billFootRight"),

    btnPrint: el("btnPrint"),
    btnExport: el("btnExport"),

    btnEditFloat: el("btnEditFloat"),
    floatModal: el("floatModal"),
    floatClose: el("floatClose"),
    floatCancel: el("floatCancel"),
    floatSave: el("floatSave"),
    floatInput: el("floatInput"),
    actualInput: el("actualInput"),
  };

  const todayISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  })();

  const DB = createMockDB();

  let state = {
    date: todayISO,
    scope: "morning",
    override: {
      morning: { openCash: null, actualCash: null },
      evening: { openCash: null, actualCash: null },
      day: { openCash: null, actualCash: null },
    },
    billQuery: "",
    billStatus: "all",
  };

  if (ui.date) ui.date.value = state.date;

  ui.tabs.forEach((b) => {
    b.addEventListener("click", () => {
      ui.tabs.forEach((x) => x.classList.remove("is-active"));
      ui.tabs.forEach((x) => x.setAttribute("aria-selected", "false"));
      b.classList.add("is-active");
      b.setAttribute("aria-selected", "true");
      state.scope = b.dataset.scope;
      render();
    });
  });

  if (ui.date) {
    ui.date.addEventListener("change", () => {
      state.date = ui.date.value || todayISO;
      render();
    });
  }

  if (ui.billSearch) {
    ui.billSearch.addEventListener("input", () => {
      state.billQuery = ui.billSearch.value.trim();
      renderBills();
    });
  }

  if (ui.billFilter) {
    ui.billFilter.addEventListener("change", () => {
      state.billStatus = ui.billFilter.value;
      renderBills();
    });
  }

  if (ui.btnPrint) {
    ui.btnPrint.addEventListener("click", () => {
      Toastify({ text: "Mở bản in (fake)", duration: 1400, gravity: "bottom", position: "right" }).showToast();
      window.print();
    });
  }

  if (ui.btnExport) {
    ui.btnExport.addEventListener("click", () => {
      Toastify({ text: "Xuất báo cáo (fake)", duration: 1400, gravity: "bottom", position: "right" }).showToast();
    });
  }

  if (ui.btnEditFloat) ui.btnEditFloat.addEventListener("click", () => openFloatModal());
  if (ui.floatClose) ui.floatClose.addEventListener("click", closeFloatModal);
  if (ui.floatCancel) ui.floatCancel.addEventListener("click", closeFloatModal);
  if (ui.floatModal) {
    ui.floatModal.addEventListener("click", (e) => {
      if (e.target && e.target.dataset && e.target.dataset.close) closeFloatModal();
    });
  }

  if (ui.floatSave) {
    ui.floatSave.addEventListener("click", () => {
      const openVal = Number(ui.floatInput?.value || 0);
      const actualVal = Number(ui.actualInput?.value || 0);
      state.override[state.scope] = { openCash: openVal, actualCash: actualVal };
      closeFloatModal();
      Toastify({ text: "Đã lưu (FE)", duration: 1200, gravity: "bottom", position: "right" }).showToast();
      render();
    });
  }

  function openFloatModal() {
    const snap = computeSnapshot(state.date, state.scope);
    if (ui.floatInput) ui.floatInput.value = String(snap.recon.openCash);
    if (ui.actualInput) ui.actualInput.value = String(snap.recon.actualCash);
    if (ui.floatModal) {
      ui.floatModal.classList.remove("is-hidden");
      ui.floatModal.setAttribute("aria-hidden", "false");
    }
  }

  function closeFloatModal() {
    if (ui.floatModal) {
      ui.floatModal.classList.add("is-hidden");
      ui.floatModal.setAttribute("aria-hidden", "true");
    }
  }

  function render() {
    const snap = computeSnapshot(state.date, state.scope);

    setText(ui.metaTime, snap.meta.time);
    setText(ui.metaCashier, snap.meta.cashier);
    setText(ui.metaBills, fmtNum(snap.meta.bills));
    setText(ui.metaRevenue, fmt(snap.kpis.netRevenue));
    setText(ui.metaDiff, fmt(snap.recon.diff));

    setText(ui.pillStatus, snap.meta.status);

    setText(ui.kpiNet, fmt(snap.kpis.netRevenue));
    setText(ui.kpiNetSub, `Gross ${fmt(snap.kpis.grossRevenue)} · -${fmt(snap.kpis.discount)} · Refund ${fmt(snap.kpis.refund)}`);

    setText(ui.kpiCash, fmt(snap.kpis.cash));
    setText(ui.kpiCashSub, `${fmtNum(snap.kpis.cashBills)} bill`);

    setText(ui.kpiBank, fmt(snap.kpis.bank));
    setText(ui.kpiBankSub, `${fmtNum(snap.kpis.bankBills)} bill`);

    setText(ui.kpiVisa, fmt(snap.kpis.visa));
    setText(ui.kpiVisaSub, `${fmtNum(snap.kpis.visaBills)} bill`);

    setText(ui.miniPaid, fmtNum(snap.meta.paidBills));
    setText(ui.miniCancel, fmtNum(snap.meta.cancelBills));
    setText(ui.miniTables, fmtNum(snap.meta.tablesServed));

    setText(ui.rcOpen, fmt(snap.recon.openCash));
    setText(ui.rcCashIn, fmt(snap.recon.cashIn));
    setText(ui.rcCashOut, fmt(snap.recon.cashOut));
    setText(ui.rcExpected, fmt(snap.recon.expectedCash));
    setText(ui.rcActual, fmt(snap.recon.actualCash));
    setText(ui.rcDiff, fmt(snap.recon.diff));

    if (ui.rcDiffRow) {
      ui.rcDiffRow.classList.remove("is-pos", "is-neg");
      if (snap.recon.diff > 0) ui.rcDiffRow.classList.add("is-pos");
      if (snap.recon.diff < 0) ui.rcDiffRow.classList.add("is-neg");
    }

    renderTop(snap.topItems);
    renderBills();
  }

  function renderTop(items) {
    if (ui.topCount) ui.topCount.textContent = `${items.length} món`;
    if (!ui.topList) return;
    ui.topList.innerHTML = "";

    const maxQty = Math.max(1, ...items.map((x) => x.qty));
    items.forEach((x) => {
      const row = document.createElement("div");
      row.className = "top-item";
      const pct = Math.round((x.qty / maxQty) * 100);
      row.innerHTML = `
        <div>
          <div class="top-name">${escapeHtml(x.name)}</div>
          <div class="top-sub">${fmtNum(x.qty)} phần · Doanh thu ${fmt(x.revenue)}</div>
        </div>
        <div class="top-right">
          <div class="top-qty">${pct}%</div>
          <div class="top-bar"><i style="width:${pct}%"></i></div>
        </div>
      `;
      ui.topList.appendChild(row);
    });
  }

  function renderBills() {
    const snap = computeSnapshot(state.date, state.scope);
    let rows = snap.bills.slice();

    const q = (state.billQuery || "").toLowerCase();
    if (q) {
      rows = rows.filter((b) => {
        const s = `${b.code} ${b.table} ${b.payMethod} ${b.status}`.toLowerCase();
        return s.includes(q);
      });
    }

    if (state.billStatus !== "all") rows = rows.filter((b) => b.status === state.billStatus);

    if (ui.billTbody) ui.billTbody.innerHTML = "";
    rows.forEach((b) => {
      if (!ui.billTbody) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(b.code)}</td>
        <td>${escapeHtml(b.time)}</td>
        <td>${escapeHtml(b.table)}</td>
        <td>${renderPay(b.payMethod)}</td>
        <td>${renderStatus(b.status)}</td>
        <td class="ta-r">${fmt(b.total)}</td>
        <td class="ta-r">${fmt(b.discount)}</td>
        <td class="ta-r">${fmt(b.net)}</td>
      `;
      ui.billTbody.appendChild(tr);
    });

    const paid = rows.filter((b) => b.status === "PAID").length;
    const pending = rows.filter((b) => b.status === "PENDING").length;
    const cancel = rows.filter((b) => b.status === "CANCELLED").length;
    const refund = rows.filter((b) => b.status === "REFUNDED").length;

    const netSum = rows.reduce((s, b) => s + Number(b.net || 0), 0);
    setText(ui.billFootLeft, `Hiển thị ${fmtNum(rows.length)} bill · Paid ${fmtNum(paid)} · Pending ${fmtNum(pending)} · Cancel ${fmtNum(cancel)} · Refund ${fmtNum(refund)}`);
    setText(ui.billFootRight, `Tổng thực thu (theo bảng) ${fmt(netSum)}`);
  }

  function computeSnapshot(dateISO, scope) {
    const day = DB[dateISO] || DB[todayISO];
    const morning = day.morning;
    const evening = day.evening;

    const data = scope === "morning" ? morning : scope === "evening" ? evening : mergeShift(morning, evening);

    const ov = state.override[scope] || {};
    const openCash = ov.openCash != null ? ov.openCash : data.recon.openCash;
    const actualCash = ov.actualCash != null ? ov.actualCash : data.recon.actualCash;

    const bills = data.bills.slice();
    const paidBills = bills.filter((b) => b.status === "PAID");
    const cancelBills = bills.filter((b) => b.status === "CANCELLED");
    const refundBills = bills.filter((b) => b.status === "REFUNDED");

    const grossRevenue = sumBy(paidBills, (b) => b.total);
    const discount = sumBy(paidBills, (b) => b.discount);
    const refund = sumBy(refundBills, (b) => b.net);
    const netRevenue = grossRevenue - discount - refund;

    const cashPaid = paidBills.filter((b) => b.payMethod === "CASH");
    const bankPaid = paidBills.filter((b) => b.payMethod === "BANK");
    const visaPaid = paidBills.filter((b) => b.payMethod === "VISA");

    const cash = sumBy(cashPaid, (b) => b.net);
    const bank = sumBy(bankPaid, (b) => b.net);
    const visa = sumBy(visaPaid, (b) => b.net);

    const cashIn = cash;
    const cashOut = data.recon.cashOut || 0;
    const expectedCash = openCash + cashIn - cashOut;
    const diff = actualCash - expectedCash;

    const topItems = buildTopItems(paidBills, 6);

    return {
      meta: {
        time: data.meta.time,
        cashier: data.meta.cashier,
        status: data.meta.status,
        bills: bills.length,
        paidBills: paidBills.length,
        cancelBills: cancelBills.length,
        tablesServed: data.meta.tablesServed,
      },
      kpis: {
        grossRevenue,
        discount,
        refund,
        netRevenue,
        cash,
        bank,
        visa,
        cashBills: cashPaid.length,
        bankBills: bankPaid.length,
        visaBills: visaPaid.length,
      },
      recon: { openCash, cashIn, cashOut, expectedCash, actualCash, diff },
      bills,
      topItems,
    };
  }

  function mergeShift(a, b) {
    const bills = [...a.bills, ...b.bills];
    return {
      meta: {
        time: "Cả ngày",
        cashier: `${a.meta.cashier} · ${b.meta.cashier}`,
        status: a.meta.status === "Đã chốt" && b.meta.status === "Đã chốt" ? "Đã chốt" : "Chưa chốt",
        tablesServed: (a.meta.tablesServed || 0) + (b.meta.tablesServed || 0),
      },
      recon: {
        openCash: a.recon.openCash,
        cashOut: (a.recon.cashOut || 0) + (b.recon.cashOut || 0),
        actualCash: b.recon.actualCash,
      },
      bills,
    };
  }

  function buildTopItems(paidBills, limit) {
    const map = new Map();
    paidBills.forEach((b) => {
      (b.items || []).forEach((it) => {
        const key = it.name;
        const cur = map.get(key) || { name: it.name, qty: 0, revenue: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.price || 0) * Number(it.qty || 0);
        map.set(key, cur);
      });
    });
    return Array.from(map.values()).sort((x, y) => y.qty - x.qty || y.revenue - x.revenue).slice(0, limit);
  }

  function sumBy(arr, fn) { return arr.reduce((s, x) => s + Number(fn(x) || 0), 0); }

  function renderStatus(st) {
    if (st === "PAID") 
      return `<span class="st is-paid">Đã thanh toán</span>`;
    if (st === "PENDING") 
      return `<span class="st is-pending">Chờ thanh toán</span>`;
    if (st === "CANCELLED") 
      return `<span class="st is-cancel">Huỷ</span>`;
    if (st === "REFUNDED") 
      return `<span class="st is-refund">Hoàn</span>`;
    return `<span class="st">${escapeHtml(st)}</span>`;
  }

  function renderPay(pm) {
    if (pm === "CASH") 
      return `<span class="pay cash">Tiền mặt</span>`;
    if (pm === "BANK") 
      return `<span class="pay bank">Chuyển khoản</span>`;
    if (pm === "VISA") 
      return `<span class="pay visa">Visa</span>`;
    if (pm === "MIX") 
      return `<span class="pay mix">Mix</span>`;
    return `<span class="pay">${escapeHtml(pm)}</span>`;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

 function createMockDB() {
  const mkBill = (code, time, table, payMethod, status, total, discount, items) => {
    const net =
      status === "PAID"
        ? Math.max(0, total - discount)
        : status === "REFUNDED"
          ? Math.max(0, total - discount)
          : 0;
    return { code, time, table, payMethod, status, total, discount, net, items: items || [] };
  };

  const date = todayISO;

  const morning = {
    meta: { time: "09:00 — 15:00", cashier: "Anna", status: "Đã chốt", tablesServed: 12 },
    recon: { openCash: 1200000, cashOut: 80000, actualCash: 2650000 },
    bills: [
      mkBill("HD-10021", "09:18", "T02", "CASH", "PAID", 625000, 0, [
        { name: "Trứng cá hồi ", qty: 1, price: 295000 },
        { name: "Bò Wagyu ", qty: 1, price: 310000 },
        { name: "Nước khoáng Pellegrino", qty: 1, price: 20000 },
      ]),
      mkBill("HD-10022", "10:05", "T05", "BANK", "PAID", 980000, 50000, [
        { name: "Sò điệp áp chảo", qty: 2, price: 185000 },
        { name: "Súp nấm Truffle", qty: 2, price: 155000 },
        { name: "Trà Oolong ấm", qty: 2, price: 50000 },
      ]),
      mkBill("HD-10023", "11:22", "T01", "VISA", "PAID", 820000, 0, [
        { name: "Cá tuyết sốt ", qty: 2, price: 295000 },
        { name: "Salad Burrata", qty: 1, price: 230000 },
      ]),
      mkBill("HD-10025", "13:15", "T10", "CASH", "CANCELLED", 0, 0, []),
      mkBill("HD-10026", "14:10", "T03", "CASH", "PAID", 745000, 30000, [
        { name: "Mì Ý sốt kem nấm", qty: 2, price: 235000 },
        { name: "Bánh mì bơ tỏi", qty: 1, price: 65000 },
        { name: "Trà hoa cúc", qty: 2, price: 60000 },
      ]),
    ],
  };

  const evening = {
    meta: { time: "15:00 — 22:00", cashier: "Hi", status: "Đã chốt", tablesServed: 18 },
    recon: { openCash: 1500000, cashOut: 120000, actualCash: 3220000 },
    bills: [
      mkBill("HD-10027", "15:25", "T06", "BANK", "PAID", 1650000, 120000, [
        { name: "Hải sản nướng", qty: 1, price: 980000 },
        { name: "bò Úc sốt tiêu xanh", qty: 1, price: 420000 },
        { name: "Rượu vang đỏ", qty: 2, price: 125000 },
      ]),
      mkBill("HD-10028", "16:40", "T12", "CASH", "PAID", 695000, 0, [
        { name: "Ức vịt áp chảo", qty: 2, price: 285000 },
        { name: "Khoai nghiền bơ", qty: 1, price: 85000 },
        { name: "Nước khoáng Perrier", qty: 1, price: 40000 },
      ]),
      mkBill("HD-10029", "18:05", "T09", "VISA", "PAID", 1450000, 100000, [
        { name: "Bò Wagyu", qty: 2, price: 310000 },
        { name: "Cá hồi Na Uy", qty: 2, price: 265000 },
        { name: "Tiramisu", qty: 2, price: 125000 },
      ]),
      mkBill("HD-10030", "19:30", "T04", "CASH", "REFUNDED", 520000, 0, [
        { name: "Mì Ý", qty: 2, price: 220000 },
        { name: "Nước ngọt", qty: 2, price: 40000 },
      ]),
      mkBill("HD-10032", "21:05", "T11", "CASH", "PAID", 1180000, 80000, [
        { name: "Cừu nướng rosemary", qty: 2, price: 295000 },
        { name: "Súp nấm Truffle", qty: 2, price: 155000 },
        { name: "Crème brûlée", qty: 2, price: 110000 },
      ]),
    ],
  };

  return { [date]: { morning, evening } };
}

  const openModal = (id) => {
    const m = document.getElementById(id);
    if (!m) 
      return;
    m.classList.remove("is-hidden");
    m.setAttribute("aria-hidden", "false");
  };

  const closeAnyModal = (modal) => {
    if (!modal) 
      return;
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  document.getElementById("btnMidDay")?.addEventListener("click", () => {
    openModal("middayModal");
  });

  document.getElementById("middayOkBtn")?.addEventListener("click", () => {
    closeAnyModal(document.getElementById("middayModal"));
    openModal("shiftClosedModal");
  });

  document.getElementById("btnDayEnd")?.addEventListener("click", () => {
    openModal("dayendModal");
  });

  document.getElementById("dayendOkBtn")?.addEventListener("click", () => {
    closeAnyModal(document.getElementById("dayendModal"));
    openModal("shiftClosedModal");
  });

  document.getElementById("reloginBtn")?.addEventListener("click", () => {
    window.location.href = "/logout";
  });

  document.querySelectorAll(".fp-modal").forEach(modal => {
    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t?.dataset?.close === "1" || t?.classList?.contains("fp-backdrop")) {
        closeAnyModal(modal);
      }
    });
  });

  render();
});
