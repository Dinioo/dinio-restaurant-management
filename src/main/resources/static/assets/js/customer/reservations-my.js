(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const grid = $("#myresGrid");
  if (!grid) 
    return;

  const tabs = $$(".myres-tab");
  const searchInput = $("#myresSearch");
  const btnClearSearch = $("#btnClearSearch");
  const filterStatus = $("#filterStatus");
  const filterArea = $("#filterArea");
  const sortBy = $("#sortBy");
  const countText = $("#countText");
  const emptyState = $("#emptyState");

  const cancelModal = $("#cancelModal");
  const viewModal = $("#viewModal");

  const cancelCodeEl = $("#cancelCode");
  const btnConfirmCancel = $("#btnConfirmCancel");

  const vCode = $("#vCode");
  const vStatus = $("#vStatus");
  const vTable = $("#vTable");
  const vArea = $("#vArea");
  const vGuests = $("#vGuests");
  const vTime = $("#vTime");
  const vNote = $("#vNote");
  const vNoteWrap = $("#vNoteWrap");
  const btnCancelFromView = $("#btnCancelFromView");

  let activeTab = "upcoming";
  let pendingCancel = { id: null, code: null };

  const norm = (str) => (str || "").toString().trim().toLowerCase();

  const statusLabel = (s) => {
    const x = (s || "").toUpperCase();
    if (x === "PENDING") 
      return "Pending";
    if (x === "CONFIRMED") 
      return "Confirmed";
    if (x === "CANCELLED") 
      return "Cancelled";
    if (x === "COMPLETED") 
      return "Completed";
    return s || "—";
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch('/dinio/api/reservations/my');
      if (response.status === 401) 
        return window.location.href = "/login";
      
      const data = await response.json();
      renderRows(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };
  
  const renderRows = (data) => {
    grid.innerHTML = ""; 
    
    data.forEach(item => {
      const article = document.createElement("article");
      article.className = "myres-row";
      
      article.dataset.id = item.id;
      article.dataset.code = item.code;
      article.dataset.status = item.status;
      article.dataset.area = item.areaKey; 
      article.dataset.table = item.table;
      article.dataset.party = item.party;
      article.dataset.datetime = item.datetime;
      article.dataset.bucket = item.bucket;
      article.dataset.note = item.note;

      const statusLower = item.status.toLowerCase();

      article.innerHTML = `
        <div class="myres-row-left">
          <div class="myres-row-top">
            <h3 class="myres-code">${item.code}</h3>
            <span class="myres-pill is-${statusLower}">${item.status}</span>
          </div>
          <div class="myres-row-sub">
            <span class="myres-kv"><i class="fa-regular fa-clock"></i> <b class="kv-val">${item.displayTime}</b></span>
            <span class="myres-kv"><i class="fa-solid fa-chair"></i> <b class="kv-val">${item.table}</b></span>
            <span class="myres-kv"><i class="fa-solid fa-layer-group"></i> <b class="kv-val">${item.area}</b></span>
            <span class="myres-kv"><i class="fa-solid fa-user-group"></i> <b class="kv-val">${item.party} khách</b></span>
          </div>
        </div>
        <div class="myres-row-actions">
          <button class="btn btn-light myres-act" type="button" data-action="view">Xem</button>
          ${(item.status === 'PENDING' || item.status === 'CONFIRMED') ? 
            `<button class="btn btn-cancel myres-act" type="button" data-action="cancel">Hủy</button>` : ''}
        </div>
      `;
      grid.appendChild(article);
    });

    apply();
  };

  fetchReservations();

  const areaLabel = (a) => {
    const x = (a || "").toLowerCase();
    if (x === "floor1") 
      return "Tầng 1";
    if (x === "floor2") 
      return "Tầng 2";
    if (x === "floor3") 
      return "Tầng 3";
    if (x === "vip") 
      return "VIP";
    if (x === "outdoor") 
      return "Outdoor";
    return a || "—";
  };

  const openModal = (el) => {
    if (!el) 
      return;
    el.classList.remove("is-hidden");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = (el) => {
    if (!el) 
      return;
    el.classList.add("is-hidden");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-close]");
    if (closeBtn) {
      const modal = e.target.closest(".myres-modal");
      if (modal) 
        closeModal(modal);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") 
      return;
    closeModal(cancelModal);
    closeModal(viewModal);
  });

  const getRows = () => $$(".myres-row", grid);

  const rowMatches = (row) => {

    const q = norm(searchInput?.value);
    if (q) {
      const hay = norm(
        `${row.dataset.code} ${row.dataset.table} ${row.dataset.area} ${row.dataset.party} ${row.dataset.datetime}`
      );
      if (!hay.includes(q)) 
        return false;
    }

    const s = (filterStatus?.value || "all").toLowerCase();
    if (s !== "all" && norm(row.dataset.status) !== s) 
      return false;

    const a = (filterArea?.value || "all").toLowerCase();
    if (a !== "all" && norm(row.dataset.area) !== a) 
      return false;

    return true;
  };

  const apply = () => {
    const rows = getRows();
    const sortMode = (sortBy?.value || "timeAsc");
    const sorted = rows.slice().sort((r1, r2) => {
      const t1 = Date.parse(r1.dataset.datetime || "") || 0;
      const t2 = Date.parse(r2.dataset.datetime || "") || 0;
      return sortMode === "timeDesc" ? (t2 - t1) : (t1 - t2);
    });

    sorted.forEach(r => grid.appendChild(r));

    let visibleCount = 0;
    rows.forEach((row) => {
      const show = rowMatches(row);
      row.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    if (countText) 
      countText.textContent = String(visibleCount);
    if (emptyState) 
      emptyState.classList.toggle("is-hidden", visibleCount !== 0);
  };

  const setTab = (tab) => {
    activeTab = tab === "past" ? "past" : "upcoming";
    tabs.forEach((b) => {
      const on = b.dataset.tab === activeTab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    apply();
  };

  tabs.forEach((b) => {
    b.addEventListener("click", () => setTab(b.dataset.tab));
  });

  searchInput?.addEventListener("input", apply);
  filterStatus?.addEventListener("change", apply);
  filterArea?.addEventListener("change", apply);
  sortBy?.addEventListener("change", apply);

  btnClearSearch?.addEventListener("click", () => {
    if (searchInput) 
      searchInput.value = "";
    apply();
    searchInput?.focus();
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) 
      return;

    const row = e.target.closest(".myres-row");
    if (!row) 
      return;

    const action = btn.dataset.action;
    const id = row.dataset.id;
    const code = row.dataset.code;

    if (action === "view") { const { status, code, table, area, party, time, note } = row.dataset;

    if (vCode) 
      vCode.textContent = code;
    if (vStatus) 
      vStatus.textContent = status;
    if (vTable) 
      vTable.textContent = table;
    if (vArea) 
      vArea.textContent = area;
    if (vGuests) 
      vGuests.textContent = party + " người";
    if (vTime) 
      vTime.textContent = time;
    
    if (vNoteWrap && vNote) {
        if (note && note !== "null") {
            vNoteWrap.style.display = "flex";
            vNote.textContent = note;
        } else {
            vNoteWrap.style.display = "none";
        }
    }
    
    openModal(viewModal);
    return;
}

    if (action === "cancel") {
      pendingCancel = { id, code };
      cancelCodeEl.textContent = code || "—";
      openModal(cancelModal);
      return;
    }
  });

  btnCancelFromView?.addEventListener("click", () => {
    const id = btnCancelFromView.dataset.id;
    const code = btnCancelFromView.dataset.code;
    closeModal(viewModal);
    pendingCancel = { id, code };
    cancelCodeEl.textContent = code || "—";
    openModal(cancelModal);
  });

  btnConfirmCancel?.addEventListener("click", async () => {
    if (!pendingCancel.id) 
      return;
    btnConfirmCancel.disabled = true;

    try {
      const response = await fetch('/dinio/api/reservations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingCancel.id })
      });

      if (response.ok) {
        closeModal(cancelModal);
        successToast(`Đã hủy thành công đơn đặt chỗ ${pendingCancel.code}`);
        fetchReservations(); 
      } else {
        errorToast(errorMsg || "Không thể hủy đơn này!");
      }
    } catch (e) {
      errorToast("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      btnConfirmCancel.disabled = false;
    }
  });

  setTab("upcoming");
})();
