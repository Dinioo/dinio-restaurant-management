document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute("content") || "";
  const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute("content") || "";

  const els = {
    floor: $("#wtFloor"),
    show: $("#wtShow"),
    query: $("#wtQuery"),
    refresh: $("#btnRefresh"),
    clearPick: $("#btnClearPick"),
    list: $("#wtmList"),

    pickTable: $("#pickTable"),
    pickArea: $("#pickArea"),
    pickSeats: $("#pickSeats"),
    pickStatus: $("#pickStatus"),
    pickGuest: $("#pickGuest"),
    pickTime: $("#pickTime"),

    btnOpenBill: $("#btnOpenBill"),
    btnPay: $("#btnPay"),

    areas: $("#tmAreas"),
    tables: $$(".tm-table"),
  };

  const STATUS_LABEL = {
    AVAILABLE: "Trống",
    RESERVED: "Đặt trước",
    OCCUPIED: "Đang ngồi",
    SEATED: "Đang ngồi",
    NEED_CLEAN: "Chờ dọn",
    VIP_AVAILABLE: "VIP • Trống",
    VIP_RESERVED: "VIP • Đặt trước",
    VIP_OCCUPIED: "VIP • Đang ngồi",
  };

  const STATUS_BADGE_CLASS = (st) => {
    const s = (st || "").toUpperCase();
    if (s === "OCCUPIED" || s === "SEATED" || s === "VIP_OCCUPIED") return "badge is-seated";
    if (s === "NEED_CLEAN") return "badge is-clean";
    if (s === "RESERVED" || s === "VIP_RESERVED") return "badge is-res";
    return "badge";
  };

  const isPayable = (st) => {
    const s = (st || "").toUpperCase();
    return s === "OCCUPIED" || s === "SEATED" || s === "NEED_CLEAN" || s === "VIP_OCCUPIED";
  };

  const formatTimeHHMM = (isoOrHHMM) => {
    if (!isoOrHHMM) return "—";
    if (/^\d{2}:\d{2}$/.test(isoOrHHMM)) return isoOrHHMM;
    const d = new Date(isoOrHHMM);
    if (Number.isNaN(d.getTime())) return "—";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const minutesSince = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const diff = Date.now() - d.getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  const readTableFromButton = (btn) => {
    const ds = btn.dataset || {};
    const status = (ds.status || "AVAILABLE").toUpperCase();
    const area = ds.area || btn.getAttribute("data-area") || "—";
    const id = ds.id || btn.getAttribute("data-id") || "—";
    const code = ds.code || btn.getAttribute("data-code") || id;
    const seats = Number(ds.seats || 0) || 0;

    const resTime = ds.resTime || "";
    const resName = ds.resName || "";
    const resPhone = ds.resPhone || "";

    const seatStart = ds.seatStart || "";
    const guestName = ds.guestName || "";
    const guestPhone = ds.guestPhone || "";
    const party = ds.party || "";

    return {
      btn,
      id,
      code,
      area,
      seats,
      status,
      resTime,
      resName,
      resPhone,
      seatStart,
      guestName,
      guestPhone,
      party,
    };
  };

  const state = {
    all: els.tables.map(readTableFromButton),
    filtered: [],
    selectedId: null,
  };

  const clearActive = () => {
    state.all.forEach((t) => t.btn.classList.remove("is-selected"));
    $$(".wtm-item", els.list).forEach((x) => x.classList.remove("is-active"));
  };

  const setPick = (t) => {
    els.pickTable.textContent = t ? t.code : "—";
    els.pickArea.textContent = t ? t.area : "—";
    els.pickSeats.textContent = t ? (t.seats ? `${t.seats} chỗ` : "—") : "—";
    els.pickStatus.textContent = t ? (STATUS_LABEL[t.status] || t.status) : "—";

    const guestLine = (() => {
      if (!t) return "—";
      if (t.status === "RESERVED" || t.status === "VIP_RESERVED") {
        const name = t.resName || "—";
        const phone = t.resPhone ? ` • ${t.resPhone}` : "";
        return `${name}${phone}`;
      }
      if (t.status === "OCCUPIED" || t.status === "SEATED" || t.status === "VIP_OCCUPIED") {
        const name = t.guestName || "—";
        const phone = t.guestPhone ? ` • ${t.guestPhone}` : "";
        return `${name}${phone}`;
      }
      return "—";
    })();

    els.pickGuest.textContent = guestLine;

    const timeLine = (() => {
      if (!t) return "—";
      if (t.status === "RESERVED" || t.status === "VIP_RESERVED") return formatTimeHHMM(t.resTime);
      if (t.status === "OCCUPIED" || t.status === "SEATED" || t.status === "VIP_OCCUPIED") {
        const m = minutesSince(t.seatStart);
        if (m == null) return "—";
        const hh = Math.floor(m / 60);
        const mm = m % 60;
        return hh > 0 ? `${hh}h${String(mm).padStart(2, "0")}` : `${mm}p`;
      }
      return "—";
    })();

    els.pickTime.textContent = timeLine;

    const enable = t && isPayable(t.status);
    els.btnOpenBill.disabled = !enable;
    els.btnPay.disabled = !enable;
  };

  const applyStatusClasses = () => {
    state.all.forEach((t) => {
      t.btn.classList.remove("is-occupied", "is-clean");
      if (t.status === "OCCUPIED" || t.status === "SEATED" || t.status === "VIP_OCCUPIED") {
        t.btn.classList.add("is-occupied");
      } else if (t.status === "NEED_CLEAN") {
        t.btn.classList.add("is-clean");
      }
    });
  };

  const computeBadgeText = (t, showMode) => {
    const mode = (showMode || "none").toLowerCase();
    if (mode === "none") return "—";

    if (mode === "reservation") {
      if (t.status === "RESERVED" || t.status === "VIP_RESERVED") return formatTimeHHMM(t.resTime);
      return "—";
    }

    if (mode === "seating") {
      if (t.status === "OCCUPIED" || t.status === "SEATED" || t.status === "VIP_OCCUPIED") {
        const m = minutesSince(t.seatStart);
        if (m == null) return "—";
        const hh = Math.floor(m / 60);
        const mm = m % 60;
        return hh > 0 ? `${hh}h${String(mm).padStart(2, "0")}` : `${mm}p`;
      }
      return "—";
    }

    if (mode === "before_reservation") {
      if (t.status === "RESERVED" || t.status === "VIP_RESERVED") {
        const now = new Date();
        const [hh, mm] = String(t.resTime || "").split(":").map((x) => parseInt(x, 10));
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "—";
        const target = new Date(now);
        target.setHours(hh, mm, 0, 0);
        const diff = Math.round((target.getTime() - now.getTime()) / 60000);
        if (Number.isNaN(diff)) return "—";
        if (diff <= 0) return "0p";
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}p`;
      }
      return "—";
    }

    if (mode === "waiting") {
      if (t.status === "AVAILABLE" || t.status === "VIP_AVAILABLE") return "0p";
      if (t.status === "RESERVED" || t.status === "VIP_RESERVED") return "—";
      if (t.status === "OCCUPIED" || t.status === "SEATED" || t.status === "VIP_OCCUPIED") return "—";
      if (t.status === "NEED_CLEAN") return "5p";
      return "—";
    }

    return "—";
  };

  const renderBadges = () => {
    const mode = els.show?.value || "none";
    state.all.forEach((t) => {
      const badge = t.btn.querySelector("[data-badge]");
      if (!badge) return;
      badge.textContent = computeBadgeText(t, mode);
    });
  };

  const matchesQuery = (t, q) => {
    if (!q) return true;
    const s = q.toLowerCase().trim();
    if (!s) return true;

    const hay = [
      t.code,
      t.id,
      t.area,
      t.status,
      t.resName,
      t.resPhone,
      t.guestName,
      t.guestPhone,
      String(t.seats || ""),
      String(t.party || ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(s);
  };

  const matchesFloor = (t, floor) => {
    if (!floor || floor === "all") return true;
    return String(t.area || "").toLowerCase() === String(floor).toLowerCase();
  };

  const renderList = () => {
    const floor = els.floor?.value || "all";
    const q = els.query?.value || "";

    state.filtered = state.all.filter((t) => matchesFloor(t, floor) && matchesQuery(t, q));

    els.list.innerHTML = state.filtered
      .map((t) => {
        const title = t.code;
        const stLabel = STATUS_LABEL[t.status] || t.status;
        const badgeCls = STATUS_BADGE_CLASS(t.status);

        const subBits = [];
        subBits.push(`${t.seats ? `${t.seats} chỗ` : "—"}`);
        if (t.status === "RESERVED" || t.status === "VIP_RESERVED") subBits.push(`Đặt: ${formatTimeHHMM(t.resTime)}`);
        if (t.status === "OCCUPIED" || t.status === "SEATED" || t.status === "VIP_OCCUPIED") {
          const m = minutesSince(t.seatStart);
          if (m != null) subBits.push(`Ngồi: ${m}p`);
        }
        if (t.area) subBits.push(t.area);

        return `
          <div class="wtm-item ${t.id === state.selectedId ? "is-active" : ""}" data-id="${t.id}">
            <div class="wtm-item-top">
              <div class="wtm-item-name">${title}</div>
              <span class="${badgeCls}">${stLabel}</span>
            </div>
            <div class="wtm-item-sub">
              ${subBits.map((x) => `<span>${x}</span>`).join("")}
            </div>
          </div>
        `;
      })
      .join("");

    state.all.forEach((t) => {
      const show = state.filtered.some((x) => x.id === t.id);
      t.btn.style.display = show ? "" : "none";
    });
  };

  const selectTableById = (id) => {
    const t = state.all.find((x) => x.id === id);
    state.selectedId = t ? t.id : null;

    clearActive();

    if (t) {
      t.btn.classList.add("is-selected");
      const item = $(`.wtm-item[data-id="${CSS.escape(t.id)}"]`, els.list);
      if (item) item.classList.add("is-active");
    }

    setPick(t);
  };

  const clearSelection = () => {
    state.selectedId = null;
    clearActive();
    setPick(null);
  };

  const openBillPage = () => {
    const t = state.all.find((x) => x.id === state.selectedId);
    if (!t) return;
    window.location.href = `/cashier/bill?tableId=${encodeURIComponent(t.id)}`;
  };

  const openPay = () => {
    const t = state.all.find((x) => x.id === state.selectedId);
    if (!t) return;

    const modal =
      document.getElementById("cashierPayModal") ||
      document.getElementById("csPayModal") ||
      document.querySelector(".cs-modal");

    if (!modal) {
      window.location.href = `/cashier/bill?tableId=${encodeURIComponent(t.id)}`;
      return;
    }

    modal.classList.remove("is-hidden");
    modal.classList.add("open");

    const setText = (sel, val) => {
      const el = modal.querySelector(sel);
      if (el) el.textContent = val;
    };

    setText("[data-pay-table]", t.code);
    setText("[data-pay-tableid]", t.id);
    setText("[data-pay-status]", STATUS_LABEL[t.status] || t.status);

    const closeEls = modal.querySelectorAll("[data-close], .fp-backdrop, .fp-x, #csPayClose, #payClose");
    closeEls.forEach((x) =>
      x.addEventListener(
        "click",
        () => {
          modal.classList.add("is-hidden");
          modal.classList.remove("open");
        },
        { once: true }
      )
    );
  };

  const bindEvents = () => {
    els.floor?.addEventListener("change", () => {
      renderList();
      renderBadges();
      if (state.selectedId && !state.filtered.some((x) => x.id === state.selectedId)) clearSelection();
    });

    els.query?.addEventListener("input", () => {
      renderList();
      if (state.selectedId && !state.filtered.some((x) => x.id === state.selectedId)) clearSelection();
    });

    els.show?.addEventListener("change", () => renderBadges());

    els.refresh?.addEventListener("click", () => {
      window.location.reload();
    });

    els.clearPick?.addEventListener("click", () => clearSelection());

    els.tables.forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = readTableFromButton(btn);
        selectTableById(t.id);
      });
    });

    els.list?.addEventListener("click", (e) => {
      const item = e.target.closest(".wtm-item");
      if (!item) return;
      const id = item.getAttribute("data-id");
      if (id) selectTableById(id);
    });

    els.btnOpenBill?.addEventListener("click", () => {
      if (els.btnOpenBill.disabled) return;
      openBillPage();
    });

    els.btnPay?.addEventListener("click", () => {
      if (els.btnPay.disabled) return;
      openPay();
    });
  };

  applyStatusClasses();
  renderBadges();
  renderList();
  clearSelection();
  bindEvents();

  window.__DINIO_CASHIER_TM__ = {
    csrfToken,
    csrfHeader,
    getSelected: () => state.all.find((x) => x.id === state.selectedId) || null,
  };
});
