(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const els = {
    resDate: $("#resDate"),
    resTime: $("#resTime"),
    resGuests: $("#resGuests"),
    resArea: $("#resArea"),

    pickTable: $("#pickTable"),
    pickArea: $("#pickArea"),
    pickSeats: $("#pickSeats"),
    pickTime: $("#pickTime"),

    fTableId: $("#fTableId"),
    fArea: $("#fArea"),
    fDate: $("#fDate"),
    fTime: $("#fTime"),
    fGuests: $("#fGuests"),

    btnSubmit: $("#btnSubmitReserve"),
    btnClear: $("#btnClearPick"),

    modeWrap: $(".tm-mode"),
    bookingMode: $("#bookingMode"),
    modeBtns: $$(".tm-mode-btn", $(".tm-mode") || document),
    panels: $$(".tm-panel[data-panel]"),

    tables: $$(".tm-table"),
    areasWrap: $("#tmAreas"),
  };

  if (!els.tables.length) return;

  const AREA_LABEL = {
    all: "Tất cả",
    floor1: "Tầng 1",
    floor2: "Tầng 2",
    floor3: "Tầng 3",
    vip: "VIP",
    outdoor: "Outdoor",
  };

  const isReserved = (status) =>
    String(status || "").toUpperCase().includes("RESERVED");

  const getNowDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getNowTimeRounded = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mi}`;
  };

  const normalizeGuests = (v) => {
    const n = parseInt(String(v || "2"), 10);
    if (Number.isNaN(n)) return 2;
    return n;
  };

  const getFilters = () => ({
    date: els.resDate?.value || "",
    time: els.resTime?.value || "",
    guests: normalizeGuests(els.resGuests?.value || "2"),
    area: els.resArea?.value || "all",
  });

  let selectedBtn = null;

  const setPickedText = (btn) => {
    const f = getFilters();
    const area = btn?.dataset?.area || "—";
    const seats = btn?.dataset?.seats || "—";
    const code = btn?.dataset?.code || btn?.dataset?.id || "—";

    if (els.pickTable) els.pickTable.textContent = code;
    if (els.pickArea) els.pickArea.textContent = AREA_LABEL[area] || area;
    if (els.pickSeats) els.pickSeats.textContent = `${seats}`;
    if (els.pickTime) {
      const timeText =
        (f.date ? f.date : "—") + (f.time ? ` • ${f.time}` : "");
      els.pickTime.textContent = timeText.trim() || "—";
    }
  };

  const setHidden = (btn) => {
    const f = getFilters();
    const area = btn?.dataset?.area || "";
    const id = btn?.dataset?.id || "";
    const time = f.time || "";
    const date = f.date || "";
    const guests = String(f.guests || "");

    if (els.fTableId) els.fTableId.value = id;
    if (els.fArea) els.fArea.value = area;
    if (els.fDate) els.fDate.value = date;
    if (els.fTime) els.fTime.value = time;
    if (els.fGuests) els.fGuests.value = guests;
  };

  const canSubmit = () => {
    const f = getFilters();
    if (!selectedBtn) return false;
    if (!f.date || !f.time) return false;
    if (!els.fTableId?.value) return false;
    return true;
  };

  const updateSubmitState = () => {
    if (!els.btnSubmit) return;
    els.btnSubmit.disabled = !canSubmit();
  };

  const clearSelected = () => {
    if (selectedBtn) selectedBtn.classList.remove("is-selected");
    selectedBtn = null;

    if (els.pickTable) els.pickTable.textContent = "—";
    if (els.pickArea) els.pickArea.textContent = "—";
    if (els.pickSeats) els.pickSeats.textContent = "—";
    if (els.pickTime) els.pickTime.textContent = "—";

    if (els.fTableId) els.fTableId.value = "";
    if (els.fArea) els.fArea.value = "";
    if (els.fDate) els.fDate.value = els.resDate?.value || "";
    if (els.fTime) els.fTime.value = els.resTime?.value || "";
    if (els.fGuests) els.fGuests.value = els.resGuests?.value || "2";

    updateSubmitState();
  };

  const selectTable = (btn) => {
    if (!btn) return;
    if (btn.disabled) return;

    const status = btn.dataset.status || "";
    if (isReserved(status)) return;

    if (selectedBtn && selectedBtn !== btn) {
      selectedBtn.classList.remove("is-selected");
    }
    selectedBtn = btn;
    selectedBtn.classList.add("is-selected");

    setPickedText(btn);
    setHidden(btn);
    updateSubmitState();
  };

  const applyFilters = () => {
    const f = getFilters();

    $$(".tm-area", els.areasWrap || document).forEach((areaSec) => {
      const a = areaSec.dataset.area || "";
      const show = f.area === "all" || f.area === a;
      areaSec.style.display = show ? "" : "none";
    });

    const need = normalizeGuests(f.guests);
    els.tables.forEach((btn) => {
      const seats = parseInt(btn.dataset.seats || "0", 10);
      const okSeats = seats >= need;

      const status = String(btn.dataset.status || "").toUpperCase();
      const vip = status.includes("VIP");
      btn.classList.toggle("is-vip", vip);

      btn.style.opacity = okSeats ? "" : "0.55";
    });

    if (selectedBtn) {
      setPickedText(selectedBtn);
      setHidden(selectedBtn);
    } else {
      if (els.fDate) els.fDate.value = els.resDate?.value || "";
      if (els.fTime) els.fTime.value = els.resTime?.value || "";
      if (els.fGuests) els.fGuests.value = els.resGuests?.value || "2";
    }

    updateSubmitState();
  };

  els.areasWrap?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tm-table");
    if (!btn) return;
    selectTable(btn);
  });

  els.btnClear?.addEventListener("click", clearSelected);

  els.resDate?.addEventListener("change", applyFilters);
  els.resTime?.addEventListener("change", applyFilters);
  els.resGuests?.addEventListener("change", applyFilters);
  els.resArea?.addEventListener("change", applyFilters);

  const setActiveTab = (mode) => {
    els.modeBtns.forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  const setPanel = (mode) => {
    els.panels.forEach((p) => {
      p.classList.toggle("is-hidden", p.dataset.panel !== mode);
    });
  };

  const syncBasic = (from, to) => {
    if (!from || !to) return;
    if (from.name && to.name) to.name.value = from.name.value || "";
    if (from.phone && to.phone) to.phone.value = from.phone.value || "";
    if (from.email && to.email) to.email.value = from.email.value || "";
  };

  const self = {
    name: $("#fullName"),
    phone: $("#phone"),
    email: $("#email"),
  };

  const other = {
    name: $("#fullName2"),
    phone: $("#phone2"),
    email: $("#email2"),
    guestName: $("#guestName"),
    guestPhone: $("#guestPhone"),
  };

  const setMode = (mode) => {
    if (mode !== "self" && mode !== "other") mode = "self";

    setActiveTab(mode);
    setPanel(mode);

    if (els.bookingMode) els.bookingMode.value = mode;

    if (other.guestName) other.guestName.required = mode === "other";
    if (other.guestPhone) other.guestPhone.required = false;

    if (mode === "other") syncBasic(self, other);
    else syncBasic(other, self);
  };

  els.modeWrap?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tm-mode-btn");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  if (els.resDate && !els.resDate.value) els.resDate.value = getNowDate();
  if (els.resTime && !els.resTime.value) els.resTime.value = getNowTimeRounded();

  if (els.fDate) els.fDate.value = els.resDate?.value || "";
  if (els.fTime) els.fTime.value = els.resTime?.value || "";
  if (els.fGuests) els.fGuests.value = els.resGuests?.value || "2";

  setMode(els.bookingMode?.value || "self");
  applyFilters();
  clearSelected();
})();
