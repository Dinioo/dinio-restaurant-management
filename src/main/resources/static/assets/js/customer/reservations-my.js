(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const grid = $("#myresGrid");
  if (!grid) return;

  // controls
  const tabs = $$(".myres-tab");
  const searchInput = $("#myresSearch");
  const btnClearSearch = $("#btnClearSearch");
  const filterStatus = $("#filterStatus");
  const filterArea = $("#filterArea");
  const sortBy = $("#sortBy");
  const countText = $("#countText");
  const emptyState = $("#emptyState");

  // modals
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
    if (x === "PENDING") return "Pending";
    if (x === "CONFIRMED") return "Confirmed";
    if (x === "CANCELLED") return "Cancelled";
    if (x === "COMPLETED") return "Completed";
    return s || "—";
  };

  const areaLabel = (a) => {
    const x = (a || "").toLowerCase();
    if (x === "floor1") return "Tầng 1";
    if (x === "floor2") return "Tầng 2";
    if (x === "floor3") return "Tầng 3";
    if (x === "vip") return "VIP";
    if (x === "outdoor") return "Outdoor";
    return a || "—";
  };

  // ===== Modal helpers =====
  const openModal = (el) => {
    if (!el) return;
    el.classList.remove("is-hidden");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = (el) => {
    if (!el) return;
    el.classList.add("is-hidden");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  // close by backdrop / [data-close]
  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-close]");
    if (closeBtn) {
      const modal = e.target.closest(".myres-modal");
      if (modal) closeModal(modal);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeModal(cancelModal);
    closeModal(viewModal);
  });

  // ===== Filter + sort =====
  const getRows = () => $$(".myres-row", grid);

  const rowMatches = (row) => {
    const bucket = row.dataset.bucket || "";
    if (bucket !== activeTab) return false;

    const q = norm(searchInput?.value);
    if (q) {
      const hay = norm(
        `${row.dataset.code} ${row.dataset.table} ${row.dataset.area} ${row.dataset.party} ${row.dataset.datetime}`
      );
      if (!hay.includes(q)) return false;
    }

    const s = (filterStatus?.value || "all").toLowerCase();
    if (s !== "all" && norm(row.dataset.status) !== s) return false;

    const a = (filterArea?.value || "all").toLowerCase();
    if (a !== "all" && norm(row.dataset.area) !== a) return false;

    return true;
  };

  const apply = () => {
    const rows = getRows();

    // sort visible rows by datetime
    const sortMode = (sortBy?.value || "timeAsc");
    const sorted = rows.slice().sort((r1, r2) => {
      const t1 = Date.parse(r1.dataset.datetime || "") || 0;
      const t2 = Date.parse(r2.dataset.datetime || "") || 0;
      return sortMode === "timeDesc" ? (t2 - t1) : (t1 - t2);
    });

    // re-append in sorted order (keeps DOM stable)
    sorted.forEach(r => grid.appendChild(r));

    let visibleCount = 0;
    rows.forEach((row) => {
      const show = rowMatches(row);
      row.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    if (countText) countText.textContent = String(visibleCount);
    if (emptyState) emptyState.classList.toggle("is-hidden", visibleCount !== 0);
  };

  // ===== Tabs =====
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

  // ===== Controls events =====
  searchInput?.addEventListener("input", apply);
  filterStatus?.addEventListener("change", apply);
  filterArea?.addEventListener("change", apply);
  sortBy?.addEventListener("change", apply);

  btnClearSearch?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    apply();
    searchInput?.focus();
  });

  // ===== Row actions (event delegation) =====
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const row = e.target.closest(".myres-row");
    if (!row) return;

    const action = btn.dataset.action;
    const id = row.dataset.id;
    const code = row.dataset.code;

    if (action === "view") {
      // fill view modal
      vCode.textContent = code || "—";
      vStatus.textContent = statusLabel(row.dataset.status);
      vTable.textContent = row.dataset.table || "—";
      vArea.textContent = areaLabel(row.dataset.area);
      vGuests.textContent = `${row.dataset.party || "—"}`;
      vTime.textContent = (row.dataset.datetime || "").replace("T", " • ") || "—";

      const note = (row.dataset.note || "").trim();
      if (note) {
        vNoteWrap.style.display = "";
        vNote.textContent = note;
      } else {
        vNoteWrap.style.display = "none";
      }

      // store for cancel from view
      btnCancelFromView.dataset.id = id || "";
      btnCancelFromView.dataset.code = code || "";

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

  // cancel from view -> open cancel modal
  btnCancelFromView?.addEventListener("click", () => {
    const id = btnCancelFromView.dataset.id;
    const code = btnCancelFromView.dataset.code;
    closeModal(viewModal);
    pendingCancel = { id, code };
    cancelCodeEl.textContent = code || "—";
    openModal(cancelModal);
  });

  // confirm cancel (demo)
  btnConfirmCancel?.addEventListener("click", async () => {
    // TODO: bạn sẽ thay bằng fetch POST /reservations/{id}/cancel hoặc form submit
    // demo UI: set status cancelled + ẩn nút hủy
    const row = getRows().find(r => r.dataset.id === pendingCancel.id);
    if (row) {
      row.dataset.status = "CANCELLED";

      // update pill
      const pill = $(".myres-pill", row);
      if (pill) {
        pill.className = "myres-pill is-cancelled";
        pill.textContent = "Cancelled";
      }
    }

    closeModal(cancelModal);
    apply();
  });

  // init
  setTab("upcoming");
})();
