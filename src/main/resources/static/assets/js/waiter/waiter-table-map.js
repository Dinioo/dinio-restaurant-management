document.addEventListener("DOMContentLoaded", () => {
  const tmAreas = document.getElementById("tmAreas");
  const list = document.getElementById("wtmList");
  const floorSel = document.getElementById("wtFloor");
  const showSel = document.getElementById("wtShow");
  const queryInp = document.getElementById("wtQuery");
  const btnRefresh = document.getElementById("btnRefresh");
  const btnClearPick = document.getElementById("btnClearPick");

  const pick = {
    table: document.getElementById("pickTable"),
    area: document.getElementById("pickArea"),
    seats: document.getElementById("pickSeats"),
    status: document.getElementById("pickStatus"),
    guest: document.getElementById("pickGuest"),
    time: document.getElementById("pickTime"),
  };

  const actions = {
    start: document.getElementById("btnStartService"),
    order: document.getElementById("btnOpenOrder"),
    checkout: document.getElementById("btnCheckout"),
    cleaned: document.getElementById("btnMarkCleaned"),
  };

  const wtCloseModal = document.getElementById("wtCloseSessionModal");
  const openCloseModal = () => {
  if (!wtCloseModal) return;
  wtCloseModal.setAttribute("aria-hidden", "false");
  wtCloseModal.classList.remove("is-hidden");
  document.body.classList.add("is-modal-open");
};

const closeCloseModal = () => {
  if (!wtCloseModal) return;
  wtCloseModal.setAttribute("aria-hidden", "true");
  wtCloseModal.classList.add("is-hidden");  
  document.body.classList.remove("is-modal-open");
};

if (wtCloseModal) {
  wtCloseModal.addEventListener("click", (e) => {
    if (e.target.closest(".fp-backdrop[data-close='1']")) {
      closeCloseModal();
      return;
    }

    if (e.target.closest("[data-close='1']")) {
      closeCloseModal();
      return;
    }

    if (e.target.closest(".fp-close, .fp-x, .wt-modal-close, #wtCloseCancelBtn")) {
      closeCloseModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wtCloseModal.getAttribute("aria-hidden") === "false") {
      closeCloseModal();
    }
  });
}

  const wtCloseConfirmBtn = document.getElementById("wtCloseConfirmBtn");

  let allTables = [];
  let occupiedReservations = [];
  let selectedTableId = null;
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

  const getLocalDateString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return (new Date(now - offset)).toISOString().split('T')[0];
  };

  const isFutureReservation = (res) => {
    if (!res || !res.reservedAt) return false;
    return new Date(res.reservedAt).getTime() > new Date().getTime();
  };

  const fetchGuestName = async (resId) => {
    if (!resId) return "Khách vãng lai";
    try {
      const response = await fetch(`${CONTEXT_PATH}/api/reservations/${resId}/guest-name`);
      if (response.ok) {
        const data = await response.json();
        return data.name || "Khách đặt";
      }
    } catch (e) {
      console.error("Sync error:", e);
      errorToast("Lỗi đồng bộ dữ liệu. Vui lòng kiểm tra kết nối mạng!");
    }
    return "Khách đặt";
  };

  const syncData = async () => {
    const today = getLocalDateString();
    try {
      const [resT, resO] = await Promise.all([
        fetch(`${CONTEXT_PATH}/api/tables`),
        fetch(`${CONTEXT_PATH}/api/reservations/occupied?date=${today}`)
      ]);

      if (resT.ok) allTables = await resT.json();
      if (resO.ok) {
        const rawOccupied = await resO.json();
        await Promise.all(rawOccupied.map(async (res) => {
          if (!res.guestName) {
            const realResId = res.id || res.reservationId;
            res.guestName = await fetchGuestName(realResId);
          }
        }));
        occupiedReservations = rawOccupied;
      }
      renderTables();
      renderList();
      if (selectedTableId) await updateSelectedInfo();
    } catch (e) { console.error("Sync error:", e); }
  };

  const renderTables = () => {
    if (!tmAreas) return;
    tmAreas.innerHTML = "";
    const grouped = allTables.reduce((acc, t) => {
      const key = t.areaKey || "floor1";
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});

    Object.keys(grouped).forEach(key => {
      const section = document.createElement("section");
      section.className = "tm-area";
      section.dataset.area = key;
      section.innerHTML = `<div class="tm-area-head"><h4>${areaLabel(key)}</h4></div><div class="tm-grid"></div>`;
      const grid = section.querySelector(".tm-grid");

      grouped[key].forEach(table => {
        const res = (table.status === "AVAILABLE") ? null : occupiedReservations.find(r => r.tableId == table.id);
        
        const btn = document.createElement("button");
        btn.type = "button";
        let statusClass = "is-available";
        if (table.status === "IN_SERVICE") statusClass = "is-occupied";
        else if (table.status === "CLEANING" || table.status === "NEED_PAYMENT") statusClass = "is-clean";
        else if (res && isFutureReservation(res)) statusClass = "is-reserved";

        btn.className = `tm-table ${statusClass} ${table.id == selectedTableId ? 'is-selected' : ''}`;
        btn.innerHTML = `<span class="t-code">${table.code}</span><span class="t-meta">${table.seats} chỗ</span>
                      <span class="t-badge">${res ? res.reservedAt.split('T')[1].substring(0, 5) : '—'}</span>`;

        btn.onclick = () => { selectedTableId = table.id; updateSelectedInfo(); };
        grid.appendChild(btn);
      });
      tmAreas.appendChild(section);
    });
    applyFilters();
  };

  const renderList = () => {
    if (!list) return;
    const query = (queryInp.value || "").trim().toLowerCase();
    list.innerHTML = "";

    const items = allTables.filter(t => {
      const res = occupiedReservations.find(r => r.tableId == t.id);
      const isActive = (t.status !== "AVAILABLE") || (res && isFutureReservation(res));
      if (!isActive) return false;
      const name = res ? (res.guestName || "Khách đặt") : "Walk-in";
      return !query || `${t.code} ${name}`.toLowerCase().includes(query);
    });

    items.forEach(t => {
      const res = occupiedReservations.find(r => r.tableId == t.id);
      const name = res ? (res.guestName || "Khách đặt") : "Walk-in";
      const party = res ? (res.seats || res.partySize || t.seats) : t.seats;
      
      let badgeClass = "badge";
      let statusText = ""; // Biến tạm để giữ chữ hiển thị

      if (t.status === "IN_SERVICE") {
          badgeClass += " is-seated";
          statusText = "SEATED";
      } else if (t.status === "CLEANING" || t.status === "NEED_PAYMENT") {
          badgeClass += " is-clean";
          statusText = "CLEAN"; // Chốt hiển thị là CLEAN cho cả 2 trạng thái
      } else if (res) {
          badgeClass += " is-res";
          statusText = "RESERVED";
      }

      const item = document.createElement("div");
      item.className = `wtm-item ${t.id == selectedTableId ? "is-active" : ""}`;
      item.innerHTML = `
        <div class="wtm-item-top">
          <div class="wtm-item-name">${name}</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="${badgeClass}">${statusText}</span> 
            <span class="badge">${t.code}</span>
          </div>
        </div>
        <div class="wtm-item-sub"><span>${party} khách</span><span>${res ? res.reservedAt.split('T')[1].substring(0, 5) : ""}</span></div>`;
      item.onclick = () => { selectedTableId = t.id; updateSelectedInfo(); };
      list.appendChild(item);
    });
  };

  const updateSelectedInfo = async () => {
    const t = allTables.find(x => x.id == selectedTableId);
    if (!t) return;
    let res = (t.status === "AVAILABLE") ? null : occupiedReservations.find(r => r.tableId == t.id);

    if (t.status === "AVAILABLE" && res && !isFutureReservation(res)) res = null;
    // Nếu đang dọn hoặc chờ thanh toán, coi như không còn khách ngồi (ẩn info đặt chỗ cũ)
    if (t.status === "CLEANING" || t.status === "NEED_PAYMENT") res = null;

    pick.table.textContent = t.code;
    pick.area.textContent = t.areaName || areaLabel(t.areaKey);
    
    // HIỂN THỊ: Nếu là NEED_PAYMENT thì vẫn ghi là CLEAN trên màn hình
    pick.status.textContent = (t.status === "NEED_PAYMENT" || t.status === "CLEANING") ? "CLEAN" : t.status;

    if (res) {
      pick.seats.textContent = res.guestName || "Đang tải...";
      pick.time.textContent = res.reservedAt.split('T')[1].substring(0, 5);
      pick.guest.textContent = `${res.seats || res.partySize || t.seats} người`;
    } else {
      pick.seats.textContent = (t.status === "IN_SERVICE") ? "Khách vãng lai" : "—";
      pick.time.textContent = "—";
      pick.guest.textContent = (t.status === "IN_SERVICE") ? `${t.seats} người` : "—";
    }

    actions.start.disabled = !(t.status === "AVAILABLE" || (res && t.status !== "IN_SERVICE"));
    actions.order.disabled = (t.status !== "IN_SERVICE");
    actions.checkout.disabled = (t.status !== "IN_SERVICE");
    
    // Nút "Đã dọn xong" sẽ sáng khi trạng thái là CLEANING hoặc NEED_PAYMENT
    actions.cleaned.disabled = !(t.status === "CLEANING" || t.status === "NEED_PAYMENT");
  };

  const clearSelectedInfo = () => {
    selectedTableId = null;
    Object.values(pick).forEach(el => { if (el) el.textContent = "—"; });
    Object.values(actions).forEach(btn => { if (btn) btn.disabled = true; });
    document.querySelectorAll(".tm-table").forEach(b => b.classList.remove("is-selected"));
  };

  const callStatusAPI = async (endpoint, status, msg) => {
    try {
      const response = await fetch(`${CONTEXT_PATH}/api/tables/${selectedTableId}/${endpoint}?status=${status}`, {
        method: "POST", headers: getHeaders()
      });
      if (response.ok) {
        await syncData();
        successToast(msg || "Cập nhật trạng thái bàn thành công!");
        return true;
      } else {
        errorToast("Không thể cập nhật trạng thái bàn. Vui lòng thử lại!");
      }
    } catch (e) {
      console.error("Lỗi cập nhật.");
      errorToast("Lỗi hệ thống khi cập nhật bàn!");
    }
    return false;
  };
  actions.start.onclick = async () => {
    const success = await callStatusAPI("status", "IN_SERVICE", "Bắt đầu phục vụ.");
    if (success) window.location.href = `${CONTEXT_PATH}/waiter/order?tableId=${selectedTableId}`;
  };

  actions.order.onclick = () => window.location.href = `${CONTEXT_PATH}/waiter/bill/review?tableId=${selectedTableId}`;

  actions.checkout.onclick = () => openCloseModal();


  wtCloseConfirmBtn.onclick = async () => {
      const tableIdToRedirect = selectedTableId; 
      const success = await callStatusAPI("status", "NEED_PAYMENT", "Bàn cần dọn");
      
      if (success) { // Chỉ chuyển trang nếu API thành công
          successToast("Đã kết thúc phiên phục vụ. Đang chuyển đến màn hình hóa đơn...");
          closeCloseModal();
          clearSelectedInfo(); 
          
          setTimeout(() => {
              window.location.href = `${CONTEXT_PATH}/waiter/bill/review?tableId=${tableIdToRedirect}`;
          }, 800);
      }
  };
  actions.cleaned.onclick = async () => {
    const resClose = await fetch(`${CONTEXT_PATH}/api/tables/${selectedTableId}/close-session`, {
        method: "POST", headers: getHeaders()
    });

    if (resClose.ok) {
        const success = await callStatusAPI("status", "AVAILABLE", "Bàn đã dọn xong, sẵn sàng đón khách.");
        if (success) {
            occupiedReservations = occupiedReservations.filter(r => r.tableId != selectedTableId);
            selectedTableId = null; 
            clearSelectedInfo();
        }
    }
};

  const applyFilters = () => {
    const f = floorSel.value;
    document.querySelectorAll(".tm-area").forEach(a => {
      a.style.display = (f === "all" || a.dataset.area === f) ? "" : "none";
    });
  };

  const areaLabel = (key) => ({ floor1: "Tầng 1", floor2: "Tầng 2", floor3: "Tầng 3", vip: "VIP", outdoor: "Outdoor" }[key] || key);

  floorSel.addEventListener("change", () => { applyFilters(); renderList(); });
  queryInp.addEventListener("input", renderList);
  btnRefresh.addEventListener("click", syncData);
  btnClearPick.addEventListener("click", clearSelectedInfo);

  syncData();
  setInterval(syncData, 15000);
});