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
  let occupiedReservations = [];
  let selectedBtn = null;
  let currentUserData = null;
  const CONTEXT_PATH = '/dinio';

  const getHeaders = () => {
    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const headers = { 'Content-Type': 'application/json' };

    if (token && header) {
      headers[header] = token;
    }
    return headers;
  };

  const fetchAndPrefillUserData = async () => {
    try {
      const response = await fetch(`${CONTEXT_PATH}/profile/api/data`);
      if (!response.ok)
        return;

      currentUserData = await response.json();

      const selfFields = {
        fullName: currentUserData.fullName,
        phone: currentUserData.phone,
        email: currentUserData.email,
        note: currentUserData.note !== "N/A" ? currentUserData.note : ""
      };

      Object.keys(selfFields).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = selfFields[id] || "";
      });

      const otherFields = {
        fullName2: currentUserData.fullName,
        phone2: currentUserData.phone,
        email2: currentUserData.email
      };

      Object.keys(otherFields).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = otherFields[id] || "";
      });

    } catch (error) {
      warningToast("Lỗi lấy thông tin người dùng:", error);
    }
  };

  const syncProfileIfChanged = async (name, phone) => {
    if (!currentUserData)
      return;

    if (name !== currentUserData.fullName || phone !== currentUserData.phone) {
      try {
        const response = await fetch(`${CONTEXT_PATH}/profile/api/update`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ fullName: name, phone: phone })
        });

        if (response.ok) {
          infoToast("Thông tin cá nhân đã được cập nhật đồng bộ.");
          currentUserData.fullName = name;
          currentUserData.phone = phone;
        }
      } catch (e) {
        warningToast("Không thể cập nhật hồ sơ cá nhân.");
      }
    }
  };

  const getDiningDuration = (seats) => {
    const s = parseInt(seats);
    if (s <= 2)
      return 105;
    if (s <= 4)
      return 120;
    if (s <= 6)
      return 150;
    return 180;
  };

  const isTableOccupied = (tableId, seats, requestedTimeStr) => {
    if (!requestedTimeStr || !resDate.value)
      return false;
    const reqStart = new Date(`${resDate.value}T${requestedTimeStr}`);
    const reqDuration = getDiningDuration(seats);
    const reqEnd = new Date(reqStart.getTime() + reqDuration * 60000);

    return occupiedReservations.some(res => {
      if (parseInt(res.tableId) !== parseInt(tableId))
        return false;
      const resStart = new Date(res.reservedAt);
      const resDuration = getDiningDuration(res.seats);
      const resEnd = new Date(resStart.getTime() + resDuration * 60000);
      return (reqStart < resEnd && reqEnd > resStart);
    });
  };

  const updateTableStatusesUI = () => {
    const timeVal = resTime.value;
    const guests = parseInt(resGuests?.value || "2");

    document.querySelectorAll(".tm-table").forEach(btn => {
      const tableId = btn.dataset.id;
      const seats = parseInt(btn.dataset.seats);
      const busyByTime = isTableOccupied(tableId, seats, timeVal);
      const isOriginalReserved = btn.dataset.status === "PENDING" || btn.dataset.status === "COMPLETED";

      btn.classList.remove("is-available", "is-reserved", "is-selected");

      if (busyByTime || isOriginalReserved) {
        btn.classList.add("is-reserved");
        btn.disabled = true;
        if (selectedBtn === btn) clearSelection();
      } else {
        btn.classList.add("is-available");
        btn.disabled = (seats < guests);
      }
      if (selectedBtn === btn) btn.classList.add("is-selected");
    });

    syncReview();
    updateSubmitEnabled();
  };

  const fetchOccupiedData = async () => {
    const date = resDate.value;
    if (!date)
      return;
    try {
      const response = await fetch(`${CONTEXT_PATH}/api/reservations/occupied?date=${date}`);
      if (!response.ok)
        return;
      occupiedReservations = await response.json();
      updateTableStatusesUI();
    } catch (e) {
      errorToast("Không thể tải trạng thái bàn bận.");
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`${CONTEXT_PATH}/api/tables`);
      if (!response.ok) throw new Error("Failed to fetch tables");
      allTables = await response.json();
      renderTables(allTables);
    } catch (error) {
      errorToast("Lỗi tải danh sách bàn.");
    }
  };

  const renderTables = (tables) => {
    if (!tmAreas)
      return;
    tmAreas.innerHTML = "";
    const grouped = {};
    tables.forEach(t => {
      const key = t.areaKey || "floor1";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    Object.keys(grouped).forEach(key => {
      const section = document.createElement("section");
      section.className = "tm-area";
      section.dataset.area = key;
      section.innerHTML = `
        <div class="tm-area-head"><h4>${areaLabel(key)}</h4><p class="tm-area-sub">${grouped[key].length} bàn</p></div>
        <div class="tm-grid"></div>`;
      const grid = section.querySelector(".tm-grid");
      grouped[key].forEach(table => {
        const btn = document.createElement("button");
        btn.className = "tm-table";
        btn.type = "button";
        btn.dataset.id = table.id;
        btn.dataset.code = table.code;
        btn.dataset.seats = table.seats;
        btn.dataset.status = table.status;
        btn.innerHTML = `<span class="t-code">${table.code}</span><span class="t-meta">${table.seats} chỗ</span>`;
        btn.addEventListener("click", () => selectTable(btn));
        grid.appendChild(btn);
      });
      tmAreas.appendChild(section);
    });
    fetchOccupiedData();
    updateAreaFilter();
  };

  const selectTable = (btn) => {
    if (!btn || btn.disabled)
      return;
    if (selectedBtn) selectedBtn.classList.remove("is-selected");
    selectedBtn = btn;
    btn.classList.add("is-selected");
    syncReview();
    updateSubmitEnabled();
  };

  const clearSelection = () => {
    if (selectedBtn) selectedBtn.classList.remove("is-selected");
    selectedBtn = null;
    syncReview();
    updateSubmitEnabled();
  };

  const syncReview = () => {
    if (!pickTable)
      return;
    pickTable.textContent = selectedBtn ? selectedBtn.dataset.code : "—";
    pickArea.textContent = selectedBtn ? areaLabel(selectedBtn.closest('.tm-area').dataset.area) : "—";
    pickSeats.textContent = selectedBtn ? `${selectedBtn.dataset.seats} chỗ` : "—";
    pickTime.textContent = formatPickedTime();
  };

  const areaLabel = (area) => {
    const map = { floor1: "Tầng 1", floor2: "Tầng 2", floor3: "Tầng 3", vip: "VIP", outdoor: "Outdoor" };
    return map[area] || area || "—";
  };

  const formatPickedTime = () => {
    const d = resDate?.value || "";
    const t = resTime?.value || "";
    return (!d || !t) ? "—" : `${d} • ${t}`;
  };

  const updateAreaFilter = () => {
    const val = resArea?.value || "all";
    document.querySelectorAll(".tm-area").forEach(s => {
      s.style.display = (val === "all" || s.dataset.area === val) ? "" : "none";
    });
  };

  const updateSubmitEnabled = () => {
    const ok = !!selectedBtn && !!resDate.value && !!resTime.value;
    if (btnSubmitReserve) btnSubmitReserve.disabled = !ok;
  };

  resTime?.addEventListener("input", updateTableStatusesUI);
  resGuests?.addEventListener("input", updateTableStatusesUI);
  resDate?.addEventListener("change", fetchOccupiedData);
  resArea?.addEventListener("change", updateAreaFilter);
  btnClearPick?.addEventListener("click", clearSelection);

  const setMode = (mode) => {
    if (!bookingMode)
      return;
    bookingMode.value = mode;
    modeBtns.forEach(b => b.classList.toggle("is-active", b.dataset.mode === mode));
    panels.forEach(p => p.classList.toggle("is-hidden", p.dataset.panel !== mode));
  };
  modeBtns.forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));

  btnSubmitReserve?.addEventListener("click", async (e) => {
    e.preventDefault();
    const mode = bookingMode.value;

    const inputName = mode === "self" ? document.getElementById("fullName").value : document.getElementById("fullName2").value;
    const inputPhone = mode === "self" ? document.getElementById("phone").value : document.getElementById("phone2").value;

    await syncProfileIfChanged(inputName, inputPhone);

    const data = {
      tableId: parseInt(selectedBtn.dataset.id),
      date: resDate.value,
      time: resTime.value,
      guests: parseInt(resGuests.value),
      note: mode === "self" ? document.getElementById("note")?.value : document.getElementById("note2")?.value,
      mode: mode,
      guestName: mode === "other" ? document.getElementById("guestName")?.value : "",
      guestPhone: mode === "other" ? document.getElementById("guestPhone")?.value : "",
    };

    btnSubmitReserve.disabled = true;
    try {
      const response = await fetch(`${CONTEXT_PATH}/api/reservations/create`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.status === "success") {
        sessionStorage.setItem("dinio_preorder_rid", result.reservationId);
        successToast("Đặt bàn thành công!");
        window.openPreOrderModal?.();
      } else {
        errorToast(result.message || "Không thể đặt bàn.");
      }
    } catch (e) {
      console.error(e);
      errorToast("Lỗi hệ thống, vui lòng thử lại sau.");
    }
    finally { btnSubmitReserve.disabled = false; }
  });

  fetchTables();
  fetchAndPrefillUserData();
});