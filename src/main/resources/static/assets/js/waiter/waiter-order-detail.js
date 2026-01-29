document.addEventListener("DOMContentLoaded", () => {
  const searchInp = document.getElementById("orderSearch");
  const chipsWrap = document.getElementById("stChips");
  const listEl    = document.getElementById("reviewList");
  const kpiWrap   = document.getElementById("kpiWrap");

  const hdrTableId   = document.getElementById("hdrTableId");
  const rightTableId = document.getElementById("rightTableId");
  const rightArea  = document.getElementById("rightArea");
  const rightParty = document.getElementById("rightParty");
  const rightStart = document.getElementById("rightStart");

  const sumItems = document.getElementById("sumItems");
  const sumSub   = document.getElementById("sumSub");
  const sumSvc   = document.getElementById("sumSvc");
  const sumVat   = document.getElementById("sumVat");
  const sumTotal = document.getElementById("sumTotal");

  const btnSendKitchenAll = document.getElementById("btnSendKitchenAll");
  const btnPrint = document.getElementById("btnPrint");
  const btnGoBillReview = document.getElementById("btnGoBillReview");

  const parts = location.pathname.split("/").filter(Boolean);
  const ctx = (parts[0] === "dinio") ? "/dinio" : "";

  const tableId = new URLSearchParams(location.search).get("tableId")
    || (hdrTableId?.textContent || "—").trim();

  if (hdrTableId) hdrTableId.textContent = tableId;
  if (rightTableId) rightTableId.textContent = tableId;

  const fmtMoney = (n) => {
    const x = Number(n || 0);
    return x.toLocaleString("vi-VN") + "đ";
  };

  const escapeHtml = (s) => String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const fakeData = () => ({
    table: { id: tableId, area: "Tầng 1", party: 4, start: "18:10" },
    lines: [
      {
        id: "L1",
        name: "Spring Rolls",
        qty: 2,
        unitPrice: 79000,
        status: "SENT",
        createdAt: "18:12",
        sentAt: "18:13",
        servedAt: null,
        note: "Ít sốt, thêm chanh.",
        tags: ["No spicy"],
      },
      {
        id: "L2",
        name: "Grilled Steak",
        qty: 1,
        unitPrice: 259000,
        status: "COOKING",
        createdAt: "18:15",
        sentAt: "18:16",
        servedAt: null,
        note: "Medium rare, không hành.",
        tags: ["Medium rare", "No onion"],
      },
      {
        id: "L3",
        name: "Cold Brew",
        qty: 2,
        unitPrice: 59000,
        status: "SERVED",
        createdAt: "18:11",
        sentAt: "18:12",
        servedAt: "18:20",
        note: "",
        tags: ["+Caramel", "+Whipped cream"],
      },
      {
        id: "L4",
        name: "Cheesecake",
        qty: 1,
        unitPrice: 79000,
        status: "NOT_SENT",
        createdAt: "18:22",
        sentAt: null,
        servedAt: null,
        note: "Để sau cùng.",
        tags: [],
      },
      {
        id: "L5",
        name: "Bruschetta",
        qty: 1,
        unitPrice: 79000,
        status: "CANCELLED",
        createdAt: "18:14",
        sentAt: null,
        servedAt: null,
        note: "Khách đổi món.",
        tags: [],
      },
    ]
  });

  let state = fakeData();
  let activeFilter = "all";

  const statusToUI = (st) => {
    switch (st) {
      case "NOT_SENT":
        return { cls: "is-not-sent", text: "CHƯA GỬI", icon: "fa-hourglass-start" };
      case "SENT":
        return { cls: "is-sent", text: "ĐÃ GỬI BẾP", icon: "fa-paper-plane" };
      case "COOKING":
        return { cls: "is-cooking", text: "ĐANG LÀM", icon: "fa-fire-burner" };
      case "SERVED":
        return { cls: "is-served", text: "ĐÃ PHỤC VỤ", icon: "fa-circle-check" };
      case "CANCELLED":
        return { cls: "is-cancelled", text: "ĐÃ HUỶ", icon: "fa-ban" };
      default:
        return { cls: "is-sent", text: st, icon: "fa-circle-info" };
    }
  };

  const calcSummary = (lines) => {
    const items = lines.reduce((s, x) => s + (Number(x.qty) || 0), 0);
    const sub = lines
      .filter(x => x.status !== "CANCELLED")
      .reduce((s, x) => s + (Number(x.qty)||0) * (Number(x.unitPrice)||0), 0);

    const svc = Math.round(sub * 0.05); // demo 5%
    const vat = Math.round((sub + svc) * 0.08); // demo 8%
    const total = sub + svc + vat;

    return { items, sub, svc, vat, total };
  };

  const renderKPIs = (lines) => {
    const count = (st) => lines.filter(x => x.status === st).length;

    const html = `
      <div class="wo-kpi-grid">
        <div class="wo-kpi">
          <div class="k-label">Món</div>
          <div class="k-val">${lines.filter(x => x.status !== "CANCELLED").length}</div>
        </div>
        <div class="wo-kpi">
          <div class="k-label">Chưa gửi</div>
          <div class="k-val">${count("NOT_SENT")}</div>
        </div>
        <div class="wo-kpi">
          <div class="k-label">Đang làm</div>
          <div class="k-val">${count("COOKING")}</div>
        </div>
        <div class="wo-kpi">
          <div class="k-label">Đã phục vụ</div>
          <div class="k-val">${count("SERVED")}</div>
        </div>
      </div>
    `;
    kpiWrap.innerHTML = html;
  };

  const filterLines = (lines) => {
    const q = (searchInp?.value || "").trim().toLowerCase();

    return lines.filter(x => {
      const okSt = (activeFilter === "all") ? true : x.status === activeFilter;
      if (!okSt) return false;

      if (!q) return true;
      const hay = `${x.name} ${x.note || ""} ${x.id}`.toLowerCase();
      return hay.includes(q);
    });
  };

  const renderList = () => {
    const lines = filterLines(state.lines);

    if (!lines.length) {
      listEl.innerHTML = `
        <div class="wo-ritem">
          <p class="wo-rname">Không có món phù hợp bộ lọc.</p>
          <div class="wo-rmeta"><span>Hãy đổi trạng thái hoặc tìm kiếm.</span></div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = lines.map(x => {
      const ui = statusToUI(x.status);
      const lineTotal = (Number(x.qty)||0) * (Number(x.unitPrice)||0);

      const tags = (x.tags || [])
        .map(t => `<span class="wo-tag"><i class="fa-solid fa-tag"></i>${escapeHtml(t)}</span>`)
        .join("");

      const timeBits = [
        x.createdAt ? `<span class="wo-time"><i class="fa-regular fa-clock"></i> Tạo: <b>${escapeHtml(x.createdAt)}</b></span>` : "",
        x.sentAt ? `<span class="wo-time"><i class="fa-solid fa-paper-plane"></i> Gửi: <b>${escapeHtml(x.sentAt)}</b></span>` : "",
        x.servedAt ? `<span class="wo-time"><i class="fa-solid fa-circle-check"></i> Serve: <b>${escapeHtml(x.servedAt)}</b></span>` : "",
      ].filter(Boolean).join("");

      return `
        <div class="wo-ritem" data-line="${escapeHtml(x.id)}">
          <div class="wo-ritem-top">
            <div>
              <p class="wo-rname">${escapeHtml(x.name)}</p>
              <div class="wo-rmeta">
                <span class="wo-rprice">${fmtMoney(x.unitPrice)} / món</span>
                <span class="dot"></span>
                <span>Mã: <b>${escapeHtml(x.id)}</b></span>
                <span class="dot"></span>
                <span>Thành tiền: <b>${fmtMoney(lineTotal)}</b></span>
              </div>
            </div>

            <div class="wo-rside">
              <span class="wo-status ${ui.cls}">
                <i class="fa-solid ${ui.icon}"></i> ${ui.text}
              </span>
              <span class="wo-mini-qty">x${Number(x.qty)||0}</span>
            </div>
          </div>

          ${(tags ? `<div class="wo-tags">${tags}</div>` : "")}
          ${(x.note ? `<div class="wo-note"><b>Ghi chú:</b> ${escapeHtml(x.note)}</div>` : "")}
          ${(timeBits ? `<div class="wo-timebar">${timeBits}</div>` : "")}
        </div>
      `;
    }).join("");
  };

  const renderRight = () => {
    if (rightArea) rightArea.textContent = state.table.area || "—";
    if (rightParty) rightParty.textContent = state.table.party ?? "—";
    if (rightStart) rightStart.textContent = state.table.start || "—";

    const s = calcSummary(state.lines);
    if (sumItems) sumItems.textContent = String(s.items);
    if (sumSub) sumSub.textContent = fmtMoney(s.sub);
    if (sumSvc) sumSvc.textContent = fmtMoney(s.svc);
    if (sumVat) sumVat.textContent = fmtMoney(s.vat);
    if (sumTotal) sumTotal.textContent = fmtMoney(s.total);

    renderKPIs(state.lines);
  };

  const setActiveFilter = (st) => {
    activeFilter = st;

    // active state cho segmented buttons
    chipsWrap?.querySelectorAll(".wo-seg-btn").forEach(b => {
      b.classList.toggle("is-active", (b.dataset.st || "all") === st);
    });

    renderList();
  };

  // ===== EVENTS =====
  chipsWrap?.addEventListener("click", (e) => {
    const btn = e.target.closest(".wo-seg-btn");
    if (!btn) return;
    setActiveFilter(btn.dataset.st || "all");
  });

  searchInp?.addEventListener("input", () => renderList());

  btnSendKitchenAll?.addEventListener("click", () => {
    // demo: set NOT_SENT -> SENT
    let changed = 0;
    state.lines = state.lines.map(x => {
      if (x.status === "NOT_SENT") {
        changed++;
        return { ...x, status: "SENT", sentAt: x.sentAt || "18:25" };
      }
      return x;
    });

    renderRight();
    renderList();

    if (typeof successToast === "function") {
      successToast(changed ? `Đã gửi ${changed} món lên bếp.` : "Không có món nào cần gửi.");
    }
  });

  btnPrint?.addEventListener("click", () => {
    if (typeof infoToast === "function") infoToast("Demo: In tạm tính (chưa nối máy in).");
  });

  btnGoBillReview?.addEventListener("click", () => {
    window.location.href = `${ctx}/waiter/bill/review?tableId=${encodeURIComponent(tableId)}`;
  });

  // init
  renderRight();
  setActiveFilter("all");
});
