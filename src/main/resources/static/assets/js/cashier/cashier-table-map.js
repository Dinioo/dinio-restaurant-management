document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const elAreas = $("#tmAreas");
  const elList = $("#wtmList");
  const elFloor = $("#wtFloor");
  const elShow = $("#wtShow");
  const btnRefresh = $("#btnRefresh");
  const btnClear = $("#btnClearPick");
  const btnOpenBill = $("#btnOpenBill");
  const btnPay = $("#btnPay");

  const pickTable = $("#pickTable");
  const pickArea = $("#pickArea");
  const pickSeats = $("#pickSeats");
  const pickStatus = $("#pickStatus");
  const pickGuest = $("#pickGuest");
  const pickTotal = $("#pickTotal");

  const wtBillModal = $("#wtBillModal");

  const billEls = {
    title: $("#wtBillTitle"),
    table: $("#wtBillTable"),
    area: $("#wtBillArea"),
    seats: $("#wtBillSeats"),
    session: $("#wtBillSession"),
    openedAt: $("#wtBillOpenedAt"),

    loading: $("#wtBillLoading"),
    empty: $("#wtBillEmpty"),
    tableLines: $("#wtBillTableLines"),
    tbody: $("#wtBillTbody"),

    sumWrap: $("#wtBillSum"),
    subtotal: $("#wtBillSubtotal"),
    tax: $("#wtBillTax"),
    svc: $("#wtBillSvc"),
    disc: $("#wtBillDisc"),
    total: $("#wtBillTotal"),
  };

  const openBillModal = () => {
    if (!wtBillModal) 
      return;
    wtBillModal.setAttribute("aria-hidden", "false");
    wtBillModal.classList.remove("is-hidden");
    document.body.classList.add("is-modal-open");
  };

  const closeBillModal = () => {
    if (!wtBillModal) 
      return;
    wtBillModal.setAttribute("aria-hidden", "true");
    wtBillModal.classList.add("is-hidden");
    document.body.classList.remove("is-modal-open");
  };

  if (wtBillModal) {
    wtBillModal.addEventListener("click", (e) => {
      if (e.target.closest(".fp-backdrop[data-close='1']")) 
        return closeBillModal();
      if (e.target.closest("[data-close='1']")) return closeBillModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wtBillModal.getAttribute("aria-hidden") === "false") {
        closeBillModal();
      }
    });
  }

  const fmtVnd = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const resetBillUI = () => {
    if (!billEls.loading) 
      return;
    billEls.loading.style.display = "";
    billEls.empty.style.display = "none";
    billEls.tableLines.style.display = "none";
    billEls.sumWrap.style.display = "none";
    if (billEls.tbody) 
      billEls.tbody.innerHTML = "";
  };

  const renderBill = (data) => {
    const t = data?.table;
    const s = data?.session;
    const inv = data?.invoice;

    if (billEls.title) 
      billEls.title.textContent = t?.code ? `Hóa đơn • Bàn ${t.code}` : "Hóa đơn";
    if (billEls.table) 
      billEls.table.textContent = t?.code || "—";
    if (billEls.area) 
      billEls.area.textContent = t?.areaName || "—";
    if (billEls.seats) 
      billEls.seats.textContent = (t?.seats ?? "—");
    if (billEls.session) 
      billEls.session.textContent = s?.id ? `#${s.id}` : "—";
    if (billEls.openedAt) 
      billEls.openedAt.textContent = s?.openedAt || "—";

    if (!inv || !Array.isArray(inv.lines) || inv.lines.length === 0) {
      billEls.loading.style.display = "none";
      billEls.empty.style.display = "";
      billEls.tableLines.style.display = "none";
      billEls.sumWrap.style.display = "none";
      return;
    }

    billEls.tbody.innerHTML = inv.lines
      .map((ln) => {
        const name = ln.name || "—";
        const qty = Number(ln.qty || 0);
        const unit = Number(ln.unitPrice || ln.price || 0);
        const lineTotal = Number(ln.lineTotal || (unit * qty) || 0);
        const noteHtml = ln.note
          ? `<div class="wt-line-note">Ghi chú: ${escapeHtml(ln.note)}</div>`
          : "";

        return `
          <tr>
            <td>
              <div class="wt-line-name">${escapeHtml(name)}</div>
              ${noteHtml}
            </td>
            <td class="num">${qty}</td>
            <td class="num">${fmtVnd(unit)}</td>
            <td class="num">${fmtVnd(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    if (billEls.subtotal) 
      billEls.subtotal.textContent = fmtVnd(inv.subtotal);
    if (billEls.tax) 
      billEls.tax.textContent = fmtVnd(inv.tax);
    if (billEls.svc) 
      billEls.svc.textContent = fmtVnd(inv.serviceCharge);
    if (billEls.disc) 
      billEls.disc.textContent = fmtVnd(inv.discountTotal);
    if (billEls.total) 
      billEls.total.textContent = fmtVnd(inv.total);

    billEls.loading.style.display = "none";
    billEls.empty.style.display = "none";
    billEls.tableLines.style.display = "";
    billEls.sumWrap.style.display = "";
  };

  const getHeaders = () => {
    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const headers = { "Content-Type": "application/json" };
    if (token && header) 
      headers[header] = token;
    return headers;
  };

  let tables = [];
  let selectedId = null;

  const AREA_META = {
    floor1: { title: "Tầng 1", sub: "Khu vực chung" },
    floor2: { title: "Tầng 2", sub: "Khu vực chung" },
    floor3: { title: "Tầng 3", sub: "Khu vực chung" },
    vip: { title: "VIP", sub: "Phòng riêng" },
    outdoor: { title: "Outdoor", sub: "Ngoài trời" },
  };

  const STATUS_META = {
    AVAILABLE: { label: "Còn trống", cls: "is-available", badge: "is-available" },
    IN_SERVICE: { label: "Đang phục vụ", cls: "is-unpaid", badge: "is-unpaid" },
    NEED_PAYMENT: { label: "Cần thanh toán", cls: "is-pending", badge: "is-pending" },
    CLEANING: { label: "Đang dọn", cls: "is-paid", badge: "is-paid" },
  };

  const statusMeta = (st) => {
    const key = String(st || "AVAILABLE").toUpperCase();
    return STATUS_META[key] || STATUS_META.AVAILABLE;
  };

  const mapAreaNameToKey = (areaName) => {
    const name = (areaName || "").toLowerCase();
    if (name.includes("1") || name.includes("floor 1")) 
      return "floor1";
    if (name.includes("2") || name.includes("floor 2")) 
      return "floor2";
    if (name.includes("3") || name.includes("floor 3")) 
      return "floor3";
    if (name.includes("vip")) 
      return "vip";
    if (name.includes("outdoor")) 
      return "outdoor";
    return "floor1";
  };

  const groupByArea = (list) => {
    const g = {};
    for (const t of list) {
      const k = t.area;
      if (!g[k]) 
        g[k] = [];
      g[k].push(t);
    }
    const order = ["floor1", "floor2", "floor3", "vip", "outdoor"];
    return order.filter((k) => g[k]?.length).map((k) => [k, g[k]]);
  };

  const clearSelectedUI = () => {
    $$(".tm-table.is-selected").forEach((b) => b.classList.remove("is-selected"));
    $$(".wtm-item.is-active").forEach((it) => it.classList.remove("is-active"));

    pickTable.textContent = "—";
    pickArea.textContent = "—";
    pickSeats.textContent = "—";
    pickStatus.textContent = "—";
    pickGuest.textContent = "—";
    pickTotal.textContent = "—";

    btnOpenBill.disabled = true;
    btnPay.disabled = true;
  };

  const setSelected = (id) => {
    selectedId = id;

    $$(".tm-table.is-selected").forEach((b) => b.classList.remove("is-selected"));
    $$(".wtm-item.is-active").forEach((it) => it.classList.remove("is-active"));

    const btn = $(`.tm-table[data-id="${CSS.escape(id)}"]`);
    if (btn) 
      btn.classList.add("is-selected");

    const row = $(`.wtm-item[data-id="${CSS.escape(id)}"]`);
    if (row) 
      row.classList.add("is-active");

    const t = tables.find((x) => x.id === id);
    if (!t) 
      return;

    const a = AREA_META[t.area]?.title || t.areaName;
    const sm = statusMeta(t.status);

    pickTable.textContent = t.code || "—";
    pickArea.textContent = a || "—";
    pickSeats.textContent = t.seats ? `${t.seats}` : "—";
    pickStatus.textContent = sm.label;
    pickGuest.textContent = t.covers ? `${t.covers}` : "—";
    pickTotal.textContent = t.totalAmountFormatted || "—";

    const hasBill = t.hasSession;
    btnOpenBill.disabled = !hasBill;
    btnPay.disabled = !hasBill;
  };

  const buildTableBtn = (t) => {
    const sm = statusMeta(t.status);
    const b = document.createElement("button");
    b.type = "button";
    b.className = `tm-table ${sm.cls}`;
    b.dataset.id = t.id;

    b.innerHTML = `
      <span class="t-code">${escapeHtml(t.code)}</span>
      <span class="t-meta">${t.seats ? `${t.seats} chỗ` : "—"}</span>
    `;

    const show = elShow?.value || "none";
    if (show === "bill_total" && t.hasSession) {
      const badge = document.createElement("span");
      badge.className = "t-badge";
      badge.textContent = t.totalAmountFormatted;
      b.appendChild(badge);
    }

    b.addEventListener("click", () => setSelected(t.id));
    return b;
  };

  const renderAreas = () => {
    if (!elAreas) 
      return;
    elAreas.innerHTML = "";

    const floor = elFloor?.value || "all";
    const list = floor === "all" ? tables : tables.filter((t) => t.area === floor);
    const grouped = groupByArea(list);

    if (!grouped.length) {
      const empty = document.createElement("p");
      empty.textContent = "Không có bàn nào.";
      elAreas.appendChild(empty);
      return;
    }

    for (const [areaKey, arr] of grouped) {
      const section = document.createElement("section");
      section.className = "tm-area";
      section.dataset.area = areaKey;

      const head = document.createElement("div");
      head.className = "tm-area-head";

      const title = document.createElement("h4");
      title.textContent = AREA_META[areaKey]?.title || areaKey;

      const sub = document.createElement("span");
      sub.className = "tm-area-sub";
      sub.textContent = AREA_META[areaKey]?.sub || "";

      head.append(title, sub);

      const grid = document.createElement("div");
      grid.className = "tm-grid";
      arr.forEach((t) => grid.appendChild(buildTableBtn(t)));

      section.append(head, grid);
      elAreas.appendChild(section);
    }
  };

  const buildListItem = (t) => {
    const sm = statusMeta(t.status);

    const it = document.createElement("div");
    it.className = "wtm-item";
    it.dataset.id = t.id;

    it.innerHTML = `
      <div class="wtm-item-top">
        <div class="wtm-item-name">${escapeHtml(t.code)}</div>
        <span class="badge ${sm.badge}">${escapeHtml(sm.label)}</span>
      </div>
      <div class="wtm-item-sub">
        <span>${escapeHtml(AREA_META[t.area]?.title || t.areaName || "—")}</span>
        <span>${escapeHtml(t.totalAmountFormatted || "—")}</span>
      </div>
    `;

    it.addEventListener("click", () => setSelected(t.id));
    return it;
  };

  const renderList = () => {
    if (!elList) 
      return;
    elList.innerHTML = "";

    const visible = tables.filter((t) => t.hasSession);
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.style.padding = "1rem";
      empty.textContent = "Chưa có bàn nào đang phục vụ.";
      elList.appendChild(empty);
      return;
    }
    visible.forEach((t) => elList.appendChild(buildListItem(t)));
  };

  const renderAll = () => {
    clearSelectedUI();
    renderAreas();
    renderList();
  };

  const load = async () => {
    try {
      const response = await fetch("/dinio/api/cashier/tables-with-bills");
      if (!response.ok) 
        throw new Error("API error");

      const data = await response.json();

      tables = data.map((t) => ({
        id: String(t.id),
        code: t.code,
        seats: t.seats,
        status: t.status,
        areaName: t.areaName,
        area: mapAreaNameToKey(t.areaName),
        hasSession: !!t.hasSession,
        sessionId: t.sessionId,
        covers: t.covers || 0,
        totalAmount: t.totalAmount || 0,
        totalAmountFormatted: t.totalAmountFormatted || "0đ",
      }));

      selectedId = null;
      renderAll();
      console.log("Đã tải", tables.length, "bàn từ API");
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      tables = [];
      renderAll();
    }
  };

  const fetchBillPreview = async (tableId) => {
    const res = await fetch(`/dinio/cashier/api/bill-preview?tableId=${encodeURIComponent(tableId)}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) 
      throw new Error("Fetch bill preview failed");
    return await res.json();
  };

  btnClear?.addEventListener("click", () => {
    selectedId = null;
    renderAll();
  });

  btnRefresh?.addEventListener("click", () => load());

  elFloor?.addEventListener("change", () => {
    selectedId = null;
    renderAll();
  });

  elShow?.addEventListener("change", () => {
    const keep = selectedId;
    renderAreas();
    if (keep) 
      setSelected(keep);
  });

  btnOpenBill?.addEventListener("click", async () => {
    if (!selectedId) 
      return;

    resetBillUI();
    openBillModal();

    try {
      const data = await fetchBillPreview(selectedId);
      renderBill(data);
    } catch (e) {
      console.error(e);

      if (billEls.loading) 
        billEls.loading.style.display = "none";
      if (billEls.empty) 
        billEls.empty.style.display = "";
      if (billEls.tableLines) 
        billEls.tableLines.style.display = "none";
      if (billEls.sumWrap) 
        billEls.sumWrap.style.display = "none";
    }
  });

  btnPay?.addEventListener("click", () => {
    if (!selectedId) 
      return;
    window.location.href = `/dinio/cashier/payment?tableId=${encodeURIComponent(selectedId)}`;
  });

  load();
});
