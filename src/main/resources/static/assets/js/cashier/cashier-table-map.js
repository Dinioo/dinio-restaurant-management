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
    AVAILABLE: {
      label: "Còn trống",
      cls: "is-available",
      badge: "is-available",
    },
    IN_SERVICE: { label: "Đang phục vụ", cls: "is-unpaid", badge: "is-unpaid" },
    NEED_PAYMENT: {
      label: "Cần thanh toán",
      cls: "is-pending",
      badge: "is-pending",
    },
    CLEANING: { label: "Đang dọn", cls: "is-paid", badge: "is-paid" },
  };

  const fmtVnd = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

  const toMinutes = (iso) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return Math.max(0, Math.floor((Date.now() - t) / 60000));
  };

  const statusMeta = (st) => {
    const key = String(st || "AVAILABLE").toUpperCase();
    return STATUS_META[key] || STATUS_META.AVAILABLE;
  };

  // Map areaName từ API sang areaKey
  const mapAreaNameToKey = (areaName) => {
    const name = (areaName || "").toLowerCase();
    if (name.includes("1") || name.includes("floor 1")) return "floor1";
    if (name.includes("2") || name.includes("floor 2")) return "floor2";
    if (name.includes("3") || name.includes("floor 3")) return "floor3";
    if (name.includes("vip")) return "vip";
    if (name.includes("outdoor")) return "outdoor";
    return "floor1";
  };

  const groupByArea = (list) => {
    const g = {};
    for (const t of list) {
      const k = t.area;
      if (!g[k]) g[k] = [];
      g[k].push(t);
    }
    const order = ["floor1", "floor2", "floor3", "vip", "outdoor"];
    return order.filter((k) => g[k]?.length).map((k) => [k, g[k]]);
  };

  const clearSelectedUI = () => {
    $$(".tm-table.is-selected").forEach((b) =>
      b.classList.remove("is-selected"),
    );
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
    $$(".tm-table.is-selected").forEach((b) =>
      b.classList.remove("is-selected"),
    );
    $$(".wtm-item.is-active").forEach((it) => it.classList.remove("is-active"));

    const btn = $(`.tm-table[data-id="${CSS.escape(id)}"]`);
    if (btn) btn.classList.add("is-selected");

    const row = $(`.wtm-item[data-id="${CSS.escape(id)}"]`);
    if (row) row.classList.add("is-active");

    const t = tables.find((x) => x.id === id);
    if (!t) return;

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

    const code = document.createElement("span");
    code.className = "t-code";
    code.textContent = t.code;

    const meta = document.createElement("span");
    meta.className = "t-meta";
    meta.textContent = t.seats ? `${t.seats} chỗ` : "—";

    b.append(code, meta);

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
    if (!elAreas) return;
    elAreas.innerHTML = "";
    const floor = elFloor?.value || "all";
    const list =
      floor === "all" ? tables : tables.filter((t) => t.area === floor);
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

    const top = document.createElement("div");
    top.className = "wtm-item-top";

    const name = document.createElement("div");
    name.className = "wtm-item-name";
    name.textContent = t.code;

    const badge = document.createElement("span");
    badge.className = `badge ${sm.badge}`;
    badge.textContent = sm.label;

    top.append(name, badge);

    const sub = document.createElement("div");
    sub.className = "wtm-item-sub";

    const a = document.createElement("span");
    a.textContent = AREA_META[t.area]?.title || t.areaName;

    const total = document.createElement("span");
    total.textContent = t.totalAmountFormatted || "—";

    sub.append(a, total);

    it.append(top, sub);
    it.addEventListener("click", () => setSelected(t.id));
    return it;
  };

  const renderList = () => {
    if (!elList) return;
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

  // Load dữ liệu thật từ API
  const load = async () => {
    try {
      const response = await fetch("/dinio/api/cashier/tables-with-bills");
      if (!response.ok) throw new Error("API error");

      const data = await response.json();

      // Transform data
      tables = data.map((t) => ({
        id: t.id,
        code: t.code,
        seats: t.seats,
        status: t.status,
        areaName: t.areaName,
        area: mapAreaNameToKey(t.areaName),
        hasSession: t.hasSession,
        sessionId: t.sessionId,
        covers: t.covers || 0,
        totalAmount: t.totalAmount || 0,
        totalAmountFormatted: t.totalAmountFormatted || "0đ",
      }));

      selectedId = null;
      renderAll();
      console.log("✅ Đã tải", tables.length, "bàn từ API");
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu:", error);
      tables = [];
      renderAll();
    }
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
    if (keep) setSelected(keep);
  });

  btnOpenBill?.addEventListener("click", () => {
    if (!selectedId) return;
    alert("Mock: mở bill của bàn ID " + selectedId);
  });

  btnPay?.addEventListener("click", () => {
    if (!selectedId) return;
    // Chuyển đến trang thanh toán với tableId
    const url = `/dinio/cashier/payment?tableId=${selectedId}`;
    window.location.href = url;
  });

  // Khởi động
  load();
});
