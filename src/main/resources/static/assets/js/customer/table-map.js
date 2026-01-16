
document.addEventListener("DOMContentLoaded", () => {
  const resDate = document.getElementById("resDate");
  const resTime = document.getElementById("resTime");
  const resGuests = document.getElementById("resGuests");
  const resArea = document.getElementById("resArea");

  const btnClearPick = document.getElementById("btnClearPick");
  const btnSubmitReserve = document.getElementById("btnSubmitReserve");

  const pickTable = document.getElementById("pickTable");
  const pickArea = document.getElementById("pickArea");
  const pickSeats = document.getElementById("pickSeats");
  const pickTime = document.getElementById("pickTime");

  const fTableId = document.getElementById("fTableId");
  const fArea = document.getElementById("fArea");
  const fDate = document.getElementById("fDate");
  const fTime = document.getElementById("fTime");
  const fGuests = document.getElementById("fGuests");

  const modeBtns = Array.from(document.querySelectorAll(".tm-mode-btn"));
  const bookingMode = document.getElementById("bookingMode");
  const panels = Array.from(document.querySelectorAll(".tm-panel"));

  const tableButtons = Array.from(document.querySelectorAll(".tm-table"));

  if (!tableButtons.length) return;

  const clampGuests = (val) => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) ? n : 2;
  };

  const areaLabel = (area) => {
    const map = {
      floor1: "Tầng 1",
      floor2: "Tầng 2",
      floor3: "Tầng 3",
      vip: "VIP",
      outdoor: "Outdoor",
    };
    return map[area] || area || "—";
  };

  const formatPickedTime = () => {
    const d = resDate?.value || "";
    const t = resTime?.value || "";
    if (!d || !t) return "—";
    return `${d} • ${t}`;
  };

  const clearStatusClasses = (btn) => {
    btn.classList.remove("is-available", "is-reserved", "is-vip", "is-selected");
  };

  const applyStatusClass = (btn) => {
    clearStatusClasses(btn);

    const status = (btn.dataset.status || "").toUpperCase();

    if (status === "AVAILABLE") btn.classList.add("is-available");
    else if (status === "RESERVED") btn.classList.add("is-reserved");
    else if (status === "VIP_AVAILABLE" || status === "VIP") btn.classList.add("is-vip");
    else {
      btn.classList.add("is-available");
    }
  };

  const isReserved = (btn) => btn.classList.contains("is-reserved");
  const seatsOf = (btn) => parseInt(btn.dataset.seats || "0", 10) || 0;

  (() => {
    if (resDate && !resDate.value) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      resDate.value = `${yyyy}-${mm}-${dd}`;
    }

    if (resTime && !resTime.value) {
      resTime.value = "19:00";
    }
  })();

  tableButtons.forEach(applyStatusClass);

  const updateAreaFilter = () => {
    const val = resArea?.value || "all";

    document.querySelectorAll(".tm-area").forEach((section) => {
      const a = section.dataset.area;
      const show = val === "all" || val === a;
      section.style.display = show ? "" : "none";
    });
  };

  const updateGuestsSuggestion = () => {
    const guests = clampGuests(resGuests?.value || "2");

    tableButtons.forEach((btn) => {
      if (isReserved(btn)) {
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
        return;
      }

      const seats = seatsOf(btn);
      const ok = seats >= guests;

      btn.disabled = !ok;
      btn.setAttribute("aria-disabled", String(!ok));

      if (!ok && btn.classList.contains("is-selected")) {
        clearSelection();
      }
    });
  };

  let selectedBtn = null;

  const syncFormHidden = () => {
    const guests = clampGuests(resGuests?.value || "2");

    fDate && (fDate.value = resDate?.value || "");
    fTime && (fTime.value = resTime?.value || "");
    fGuests && (fGuests.value = String(guests));

    if (selectedBtn) {
      fTableId && (fTableId.value = selectedBtn.dataset.id || "");
      fArea && (fArea.value = selectedBtn.dataset.area || "");
    } else {
      fTableId && (fTableId.value = "");
      fArea && (fArea.value = "");
    }
  };

  const syncReview = () => {
    if (!pickTable) return;

    if (!selectedBtn) {
      pickTable.textContent = "—";
      pickArea.textContent = "—";
      pickSeats.textContent = "—";
      pickTime.textContent = formatPickedTime();
      return;
    }

    pickTable.textContent = selectedBtn.dataset.code || selectedBtn.dataset.id || "—";
    pickArea.textContent = areaLabel(selectedBtn.dataset.area || "");
    pickSeats.textContent = `${seatsOf(selectedBtn)} chỗ`;
    pickTime.textContent = formatPickedTime();
  };

  const updateSubmitEnabled = () => {
    const ok =
      !!selectedBtn &&
      !!(resDate?.value) &&
      !!(resTime?.value) &&
      !!(resGuests?.value);

    if (btnSubmitReserve) btnSubmitReserve.disabled = !ok;
  };

  const clearSelection = () => {
    if (selectedBtn) {
      selectedBtn.classList.remove("is-selected");
      applyStatusClass(selectedBtn);
    }
    selectedBtn = null;
    syncReview();
    syncFormHidden();
    updateSubmitEnabled();
  };

  const selectTable = (btn) => {
    if (!btn || btn.disabled) return;
    if (isReserved(btn)) return;

    if (selectedBtn && selectedBtn !== btn) {
      selectedBtn.classList.remove("is-selected");
      applyStatusClass(selectedBtn);
    }

    selectedBtn = btn;

    applyStatusClass(btn);
    btn.classList.add("is-selected");

    syncReview();
    syncFormHidden();
    updateSubmitEnabled();
  };

  tableButtons.forEach((btn) => {
    btn.addEventListener("click", () => selectTable(btn));
  });

  btnClearPick?.addEventListener("click", clearSelection);

  const onParamsChanged = () => {
    syncReview();
    syncFormHidden();
    updateGuestsSuggestion();
    updateAreaFilter();
    updateSubmitEnabled();
  };

  resDate?.addEventListener("change", onParamsChanged);
  resTime?.addEventListener("change", onParamsChanged);
  resGuests?.addEventListener("change", onParamsChanged);
  resArea?.addEventListener("change", () => {
    updateAreaFilter();
    const val = resArea.value;
    if (selectedBtn) {
      const a = selectedBtn.dataset.area;
      if (val !== "all" && a !== val) clearSelection();
    }
    updateSubmitEnabled();
  });

  const setMode = (mode) => {
    if (!bookingMode) return;
    bookingMode.value = mode;

    modeBtns.forEach((b) => {
      const active = b.dataset.mode === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });

    panels.forEach((p) => {
      const show = p.dataset.panel === mode;
      p.classList.toggle("is-hidden", !show);
    });
  };

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => setMode(b.dataset.mode || "self"));
  });

  const init = () => {
    tableButtons.forEach((btn) => {
      applyStatusClass(btn);
      if ((btn.dataset.status || "").toUpperCase() === "RESERVED") {
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
      }
    });

    setMode(bookingMode?.value || "self");

    syncReview();
    syncFormHidden();
    updateAreaFilter();
    updateGuestsSuggestion();
    updateSubmitEnabled();
  };

  init();
  const form = document.getElementById("reserveForm");
  form?.addEventListener("submit", (e) => {
    syncFormHidden();
    const ok =
      !!selectedBtn &&
      !!(resDate?.value) &&
      !!(resTime?.value) &&
      !!(resGuests?.value);

    if (!ok) {
      e.preventDefault();
    }
  });
});
