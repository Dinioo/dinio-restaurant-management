document.addEventListener("DOMContentLoaded", () => {
  const tables = Array.from(document.querySelectorAll(".tm-table"));
  const list = document.getElementById("wtmList");

  const floorSel = document.getElementById("wtFloor");
  const showSel  = document.getElementById("wtShow");
  const queryInp = document.getElementById("wtQuery");

  const btnClearPick = document.getElementById("btnClearPick");
  const btnRefresh   = document.getElementById("btnRefresh");

  const pick = {
    table:  document.getElementById("pickTable"),
    area:   document.getElementById("pickArea"),
    seats:  document.getElementById("pickSeats"),
    status: document.getElementById("pickStatus"),
    guest:  document.getElementById("pickGuest"),
    time:   document.getElementById("pickTime"),
  };

  const actions = {
    start:   document.getElementById("btnStartService"),
    order:   document.getElementById("btnOpenOrder"),
    checkout:document.getElementById("btnCheckout"),
    cleaned: document.getElementById("btnMarkCleaned"),
  };

  const fmtDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h <= 0) return `${m}m`;
    return `${h}h${m}m`;
  };

  const minutesSince = (iso) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return null;
    return Math.max(0, Math.floor((Date.now() - t) / 60000));
  };

  const escapeHtml = (s) => {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const applyStatusClasses = () => {
    tables.forEach(t => {
      const s = t.dataset.status;
      t.classList.remove("is-available","is-reserved","is-vip","is-selected","is-occupied","is-clean");

      if (s === "AVAILABLE") t.classList.add("is-available");
      else if (s === "RESERVED") t.classList.add("is-reserved");
      else if (s === "VIP_AVAILABLE") t.classList.add("is-vip");
      else if (s === "OCCUPIED") t.classList.add("is-occupied");
      else if (s === "NEED_CLEAN") t.classList.add("is-clean");
    });
  };

  const updateBadges = () => {
    const mode = showSel.value;

    tables.forEach(t => {
      const badge = t.querySelector("[data-badge]");
      if (!badge) return;

      badge.style.display = (mode === "none") ? "none" : "inline-flex";
      badge.textContent = "—";

      if (mode === "seating") {
        const mins = minutesSince(t.dataset.seatStart);
        if (mins != null && t.dataset.status === "OCCUPIED") badge.textContent = fmtDuration(mins);
      }

      if (mode === "reservation") {
        if (t.dataset.resTime && t.dataset.status === "RESERVED") badge.textContent = t.dataset.resTime;
      }

      if (mode === "before_reservation") {
        const rt = t.dataset.resTime;
        if (rt && t.dataset.status === "RESERVED") {
          const [hh, mm] = rt.split(":").map(Number);
          if (Number.isFinite(hh) && Number.isFinite(mm)) {
            const now = new Date();
            const res = new Date(now);
            res.setHours(hh, mm, 0, 0);
            const diff = Math.floor((res.getTime() - now.getTime()) / 60000);
            badge.textContent = diff >= 0 ? fmtDuration(diff) : "—";
          }
        }
      }

      if (mode === "waiting") {
        if (t.dataset.status === "RESERVED") badge.textContent = "15m";
      }
    });
  };

  const clearSelected = () => {
    tables.forEach(t => t.classList.remove("is-selected"));
    Array.from(document.querySelectorAll(".wtm-item")).forEach(i => i.classList.remove("is-active"));

    pick.table.textContent = "—";
    pick.area.textContent = "—";
    pick.seats.textContent = "—";
    pick.status.textContent = "—";
    pick.guest.textContent = "—";
    pick.time.textContent = "—";

    Object.values(actions).forEach(b => b.disabled = true);
  };

  const setActionEnabled = (t) => {
    Object.values(actions).forEach(b => b.disabled = true);
    if (!t) return;

    const s = t.dataset.status;

    if (s === "AVAILABLE" || s === "VIP_AVAILABLE" || s === "RESERVED") {
      actions.start.disabled = false;
    }
    if (s === "OCCUPIED") {
      actions.order.disabled = false;
      actions.checkout.disabled = false;
    }
    if (s === "NEED_CLEAN") {
      actions.cleaned.disabled = false;
    }
  };

  const setPicked = (t) => {
    pick.table.textContent  = t.dataset.code || "—";
    pick.area.textContent   = t.dataset.area || "—";
    pick.seats.textContent  = (t.dataset.seats ? `${t.dataset.seats} chỗ` : "—");
    pick.status.textContent = t.dataset.status || "—";

    const guest = t.dataset.guestName || t.dataset.resName || "—";
    pick.guest.textContent = guest;

    const mode = showSel.value;
    if (mode === "seating") {
      const mins = minutesSince(t.dataset.seatStart);
      pick.time.textContent = mins != null ? fmtDuration(mins) : "—";
    } else if (t.dataset.resTime) {
      pick.time.textContent = t.dataset.resTime;
    } else {
      pick.time.textContent = "—";
    }

    setActionEnabled(t);
  };

  const selectTable = (t, fromList=false) => {
    tables.forEach(x => x.classList.remove("is-selected"));
    t.classList.add("is-selected");

    Array.from(document.querySelectorAll(".wtm-item")).forEach(i => i.classList.remove("is-active"));
    const item = Array.from(document.querySelectorAll(".wtm-item"))
      .find(i => i.dataset.tableId === t.dataset.id);
    if (item) item.classList.add("is-active");

    setPicked(t);

    if (!fromList && typeof infoToast === "function") infoToast(`Đã chọn ${t.dataset.code}`);
  };

  const applyFloorFilter = () => {
    const f = floorSel.value;
    const areas = Array.from(document.querySelectorAll(".tm-area"));
    areas.forEach(a => {
      const ok = (f === "all") || (a.dataset.area === f);
      a.style.display = ok ? "" : "none";
    });
  };

  const buildListData = () => {
    const q = (queryInp.value || "").trim().toLowerCase();

    const items = tables
      .map(t => {
        const s = t.dataset.status;
        if (s !== "OCCUPIED" && s !== "RESERVED" && s !== "NEED_CLEAN") return null;

        const code  = t.dataset.code || "";
        const name  = t.dataset.guestName || t.dataset.resName || "—";
        const phone = t.dataset.guestPhone || t.dataset.resPhone || "";
        const party = t.dataset.party || "";
        const resTime = t.dataset.resTime || "";
        const seatedMin = minutesSince(t.dataset.seatStart);

        const hay = `${code} ${name} ${phone}`.toLowerCase();
        if (q && !hay.includes(q)) return null;

        return { id: t.dataset.id, code, name, phone, party, status: s, resTime, seatedMin };
      })
      .filter(Boolean);

    const rank = (s) => (s === "OCCUPIED" ? 0 : s === "RESERVED" ? 1 : 2);
    items.sort((a,b) => rank(a.status) - rank(b.status));
    return items;
  };

  const renderList = () => {
    const items = buildListData();
    list.innerHTML = "";

    if (items.length === 0) {
      list.innerHTML = `
        <div class="wtm-item" style="cursor:default;">
          <div class="wtm-item-name">Không có bàn seated/reserved</div>
          <div class="wtm-item-sub">Hãy thử đổi tầng hoặc tìm kiếm.</div>
        </div>`;
      return;
    }

    items.forEach(it => {
      const badgeClass =
        it.status === "OCCUPIED" ? "badge is-seated" :
        it.status === "NEED_CLEAN" ? "badge is-clean" :
        "badge is-res";

      const badgeText =
        it.status === "OCCUPIED" ? "SEATED" :
        it.status === "NEED_CLEAN" ? "NEED CLEAN" :
        "RESERVED";

      const timeText =
        it.status === "OCCUPIED"
          ? (it.seatedMin != null ? `${fmtDuration(it.seatedMin)}` : "")
          : (it.resTime ? it.resTime : "");

      const partyText = it.party ? `${it.party} khách` : "";

      const el = document.createElement("div");
      el.className = "wtm-item";
      el.dataset.tableId = it.id;

      el.innerHTML = `
        <div class="wtm-item-top">
          <div class="wtm-item-name">${escapeHtml(it.name)}</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="${badgeClass}">${badgeText}</span>
            <span class="badge">${escapeHtml(it.code)}</span>
          </div>
        </div>
        <div class="wtm-item-sub">
          <span>${escapeHtml(partyText)}</span>
          <span>${escapeHtml(it.phone)}</span>
          <span>${escapeHtml(timeText)}</span>
        </div>
      `;

      el.addEventListener("click", () => {
        const t = tables.find(x => x.dataset.id === it.id);
        if (t) selectTable(t, true);
      });

      list.appendChild(el);
    });
  };

  const getSelectedTable = () => tables.find(t => t.classList.contains("is-selected"));

  actions.start.addEventListener("click", () => {
    const t = getSelectedTable();
    if (!t) return;

    t.dataset.status = "OCCUPIED";
    t.dataset.seatStart = new Date().toISOString();
    if (!t.dataset.guestName) t.dataset.guestName = "Walk-in";
    if (!t.dataset.party) t.dataset.party = t.dataset.seats || "—";

    applyStatusClasses();
    updateBadges();
    renderList();
    setPicked(t);

    if (typeof successToast === "function") successToast(`Bắt đầu phục vụ ${t.dataset.code}`);
  });

  actions.order.addEventListener("click", () => {
    const t = getSelectedTable();
    if (!t) return;

    window.location.href = `./order?tableId=${encodeURIComponent(t.dataset.id)}`;
  });

  actions.checkout.addEventListener("click", () => {
    const t = getSelectedTable();
    if (!t) return;

    t.dataset.status = "NEED_CLEAN";
    applyStatusClasses();
    updateBadges();
    renderList();
    setPicked(t);

    if (typeof successToast === "function") successToast(`Đã chuyển ${t.dataset.code} sang NEED_CLEAN`);
  });

  actions.cleaned.addEventListener("click", () => {
    const t = getSelectedTable();
    if (!t) return;

    t.dataset.status = "AVAILABLE";
    delete t.dataset.guestName;
    delete t.dataset.guestPhone;
    delete t.dataset.party;
    delete t.dataset.seatStart;

    applyStatusClasses();
    updateBadges();
    renderList();
    setPicked(t);

    if (typeof successToast === "function") successToast(`Đã dọn xong ${t.dataset.code}`);
  });

  tables.forEach(t => t.addEventListener("click", () => selectTable(t)));

  btnClearPick.addEventListener("click", clearSelected);

  btnRefresh.addEventListener("click", () => {
    applyStatusClasses();
    updateBadges();
    renderList();
    if (typeof infoToast === "function") infoToast("Refreshed (demo)");
  });

  floorSel.addEventListener("change", () => {
    applyFloorFilter();
    renderList();
  });

  showSel.addEventListener("change", () => {
    updateBadges();
    const t = getSelectedTable();
    if (t) setPicked(t);
  });

  queryInp.addEventListener("input", renderList);

  applyStatusClasses();
  applyFloorFilter();
  updateBadges();
  renderList();
  clearSelected();
});
