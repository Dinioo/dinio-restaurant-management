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

  const modeBtns = Array.from(document.querySelectorAll(".tm-mode-btn"));
  const bookingMode = document.getElementById("bookingMode");
  const panels = Array.from(document.querySelectorAll(".tm-panel"));

  const tmAreas = document.getElementById("tmAreas");

  let allTables = [];
  let selectedBtn = null;

  // === Helper functions ===
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
    btn.classList.remove(
      "is-available",
      "is-reserved",
      "is-vip",
      "is-selected",
    );
  };

  const applyStatusClass = (btn) => {
    clearStatusClasses(btn);
    const status = (btn.dataset.status || "").toUpperCase();

    if (status === "AVAILABLE") btn.classList.add("is-available");
    else if (status === "IN_SERVICE" || status === "RESERVED")
      btn.classList.add("is-reserved");
    else btn.classList.add("is-available"); // default
  };

  const isReserved = (btn) => btn.classList.contains("is-reserved");
  const seatsOf = (btn) => parseInt(btn.dataset.seats || "0", 10) || 0;

  // === Initialize date/time ===
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

  // === Fetch and render tables ===
  const fetchTables = async () => {
    try {
      const response = await fetch("/dinio/api/tables");
      if (!response.ok) throw new Error("Failed to fetch tables");

      const data = await response.json();
      allTables = data;
      renderTables(data);
    } catch (error) {
      console.error("Error fetching tables:", error);
      alert("Không thể tải danh sách bàn!");
    }
  };

  const renderTables = (tables) => {
    if (!tmAreas) return;

    // Group by area
    const grouped = {};
    tables.forEach((table) => {
      const areaKey = table.areaKey || "floor1";
      if (!grouped[areaKey]) grouped[areaKey] = [];
      grouped[areaKey].push(table);
    });

    tmAreas.innerHTML = "";

    Object.keys(grouped).forEach((areaKey) => {
      const section = document.createElement("section");
      section.className = "tm-area";
      section.dataset.area = areaKey;

      const head = document.createElement("div");
      head.className = "tm-area-head";
      head.innerHTML = `
        <h4>${areaLabel(areaKey)}</h4>
        <p class="tm-area-sub">${grouped[areaKey].length} bàn</p>
      `;

      const grid = document.createElement("div");
      grid.className = "tm-grid";

      grouped[areaKey].forEach((table) => {
        const btn = document.createElement("button");
        btn.className = "tm-table";
        btn.type = "button";
        btn.dataset.id = table.id;
        btn.dataset.code = table.code;
        btn.dataset.area = areaKey;
        btn.dataset.seats = table.seats;
        btn.dataset.status = table.status;

        btn.innerHTML = `
          <span class="t-code">${table.code}</span>
          <span class="t-meta">${table.seats} chỗ</span>
        `;

        applyStatusClass(btn);

        btn.addEventListener("click", () => selectTable(btn));

        grid.appendChild(btn);
      });

      section.appendChild(head);
      section.appendChild(grid);
      tmAreas.appendChild(section);
    });

    updateGuestsSuggestion();
    updateAreaFilter();
  };

  // === Selection logic ===
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
    updateSubmitEnabled();
  };

  const clearSelection = () => {
    if (selectedBtn) {
      selectedBtn.classList.remove("is-selected");
      applyStatusClass(selectedBtn);
    }
    selectedBtn = null;
    syncReview();
    updateSubmitEnabled();
  };

  btnClearPick?.addEventListener("click", clearSelection);

  // === Sync review panel ===
  const syncReview = () => {
    if (!pickTable) return;

    if (!selectedBtn) {
      pickTable.textContent = "—";
      pickArea.textContent = "—";
      pickSeats.textContent = "—";
      pickTime.textContent = formatPickedTime();
      return;
    }

    pickTable.textContent = selectedBtn.dataset.code || "—";
    pickArea.textContent = areaLabel(selectedBtn.dataset.area || "");
    pickSeats.textContent = `${seatsOf(selectedBtn)} chỗ`;
    pickTime.textContent = formatPickedTime();
  };

  // === Update filters ===
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

    document.querySelectorAll(".tm-table").forEach((btn) => {
      if (isReserved(btn)) {
        btn.disabled = true;
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

  const updateSubmitEnabled = () => {
    const ok =
      !!selectedBtn &&
      !!resDate?.value &&
      !!resTime?.value &&
      !!resGuests?.value;

    if (btnSubmitReserve) btnSubmitReserve.disabled = !ok;
  };

  // === Event listeners ===
  const onParamsChanged = () => {
    syncReview();
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

  // === Mode toggle ===
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

  // === Form submit ===
  btnSubmitReserve?.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!selectedBtn) {
      alert("Vui lòng chọn bàn!");
      return;
    }

    const mode = bookingMode?.value || "self";
    const data = {
      tableId: parseInt(selectedBtn.dataset.id),
      date: resDate?.value,
      time: resTime?.value,
      guests: parseInt(resGuests?.value),
      note:
        mode === "self"
          ? document.getElementById("note")?.value || ""
          : document.getElementById("note2")?.value || "",
      mode: mode,
    };

    // Handle "other" mode
    if (mode === "other") {
      data.guestName = document.getElementById("guestName")?.value || "";
      data.guestPhone = document.getElementById("guestPhone")?.value || "";
    }

    try {
      btnSubmitReserve.disabled = true;
      btnSubmitReserve.textContent = "Đang xử lý...";

      const response = await fetch("/dinio/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        // Open preorder modal
        if (typeof window.openPreOrderModal === "function") {
          window.openPreOrderModal();
        } else {
          alert("Đặt bàn thành công!");
          window.location.href = "/dinio/reservations/my";
        }
      } else {
        alert(result.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Không thể kết nối đến server!");
    } finally {
      btnSubmitReserve.disabled = false;
      btnSubmitReserve.textContent = "Đặt bàn";
    }
  });

  // === Initialize ===
  fetchTables();
  setMode(bookingMode?.value || "self");
  syncReview();
  updateSubmitEnabled();
});
