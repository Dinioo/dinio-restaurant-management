(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  document.addEventListener("DOMContentLoaded", () => {
    const CANCEL_LEAD_MINUTES = 60; // bạn đổi tuỳ ý
    const leadText = $("#leadMinutesText");
    if (leadText) leadText.textContent = String(CANCEL_LEAD_MINUTES);

    const grid = $("#myresGrid");
    const emptyState = $("#emptyState");
    const countText = $("#countText");

    const qInput = $("#myresSearch");
    const filterStatus = $("#filterStatus");
    const filterArea = $("#filterArea");
    const sortBy = $("#sortBy");
    const tabs = $$(".myres-tabs .btn.btn-order[data-tab]");

    const cancelModal = $("#cancelModal");
    const cancelCode = $("#cancelCode");
    const btnConfirmCancel = $("#btnConfirmCancel");

    const viewModal = $("#viewModal");
    const btnCancelFromView = $("#btnCancelFromView");

    const vCode = $("#vCode");
    const vStatus = $("#vStatus");
    const vTable = $("#vTable");
    const vArea = $("#vArea");
    const vGuests = $("#vGuests");
    const vTime = $("#vTime");

    if (!grid || !qInput || !filterStatus || !filterArea || !sortBy) {
      console.warn("[myres] Missing elements. Check ids: myresGrid, myresSearch, filterStatus, filterArea, sortBy");
      return;
    }

    let activeTab = "upcoming";
    let pendingCancelCard = null;
    let currentViewCard = null;

    const toTs = (dt) => {
      const t = new Date(dt + ":00").getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const canCancel = (card) => {
      const status = (card.dataset.status || "").toUpperCase();
      if (status === "CANCELLED" || status === "COMPLETED") return false;

      const dt = card.dataset.datetime;
      if (!dt) return false;

      return (toTs(dt) - Date.now()) >= CANCEL_LEAD_MINUTES * 60 * 1000;
    };

    const matchesSearch = (card, q) => {
      if (!q) return true;
      q = q.toLowerCase();

      const code = (card.dataset.code || "").toLowerCase();
      const table = (card.dataset.table || "").toLowerCase();
      const area = (card.dataset.area || "").toLowerCase();

      return code.includes(q) || table.includes(q) || area.includes(q);
    };

    const getCancelBtn = (card) => $(".myres-actions button.btn-cancel", card);
    const getViewBtn = (card) => $(".myres-actions a.btn-light", card);

    const statusLabel = (st) => {
      st = (st || "").toUpperCase();
      const map = { PENDING: "Pending", CONFIRMED: "Confirmed", CANCELLED: "Cancelled", COMPLETED: "Completed" };
      return map[st] || st || "—";
    };

    const areaLabel = (ar) => {
      ar = (ar || "").toLowerCase();
      const map = {
        floor1: "Tầng 1",
        floor2: "Tầng 2",
        floor3: "Tầng 3",
        vip: "VIP",
        outdoor: "Outdoor",
      };
      return map[ar] || ar || "—";
    };

    const fmtTime = (dt) => (dt ? dt.replace("T", " • ") : "—");

    const openModal = (modal) => {
      if (!modal) return;
      modal.classList.remove("is-hidden");
      modal.setAttribute("aria-hidden", "false");
    };

    const closeModal = (modal) => {
      if (!modal) return;
      modal.classList.add("is-hidden");
      modal.setAttribute("aria-hidden", "true");
    };

    const bindModalClose = (modal) => {
      if (!modal) return;
      modal.addEventListener("click", (e) => {
        if (e.target.matches("[data-close]") || e.target.closest("[data-close]")) closeModal(modal);
      });
    };

    bindModalClose(cancelModal);
    bindModalClose(viewModal);

    function apply() {
      const q = (qInput.value || "").trim();
      const st = (filterStatus.value || "all").toUpperCase();
      const ar = (filterArea.value || "all").toLowerCase();
      const sort = sortBy.value || "timeAsc";

      const cards = $$(".myres-card", grid);
      let visible = [];

      for (const card of cards) {
        const bucket = (card.dataset.bucket || "upcoming").toLowerCase();
        const status = (card.dataset.status || "").toUpperCase();
        const area = (card.dataset.area || "").toLowerCase();

        let ok = true;
        if (bucket !== activeTab) ok = false;
        if (st !== "ALL" && status !== st) ok = false;
        if (ar !== "all" && area !== ar) ok = false;
        if (!matchesSearch(card, q)) ok = false;

        card.style.display = ok ? "" : "none";
        if (ok) visible.push(card);
      }

      visible.sort((a, b) => {
        const ta = toTs(a.dataset.datetime || "1970-01-01T00:00");
        const tb = toTs(b.dataset.datetime || "1970-01-01T00:00");
        return sort === "timeAsc" ? ta - tb : tb - ta;
      });
      visible.forEach((c) => grid.appendChild(c));

      if (countText) countText.textContent = String(visible.length);
      if (emptyState) emptyState.classList.toggle("is-hidden", visible.length !== 0);

      visible.forEach((card) => {
        const btn = getCancelBtn(card);
        if (!btn) return;

        const disabled = !canCancel(card);
        btn.disabled = disabled;
        btn.title = disabled
          ? `Chỉ hủy khi còn ≥ ${CANCEL_LEAD_MINUTES} phút hoặc không ở trạng thái Completed/Cancelled.`
          : "Hủy đặt";
      });
    }

    if (tabs.length) {
      tabs.forEach((t) => t.classList.remove("is-active"));
      const first = tabs.find((t) => (t.dataset.tab || "") === "upcoming") || tabs[0];
      first.classList.add("is-active");
      activeTab = (first.dataset.tab || "upcoming").toLowerCase();

      tabs.forEach((btn) => {
        btn.addEventListener("click", () => {
          tabs.forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          activeTab = (btn.dataset.tab || "upcoming").toLowerCase();
          apply();
        });
      });
    }

    qInput.addEventListener("input", apply);
    filterStatus.addEventListener("change", apply);
    filterArea.addEventListener("change", apply);
    sortBy.addEventListener("change", apply);

    const openCancelForCard = (card) => {
      if (!card) return;

      if (!canCancel(card)) return;

      pendingCancelCard = card;
      const code = card.dataset.code || "—";
      if (cancelCode) cancelCode.textContent = code;
      openModal(cancelModal);
    };

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".myres-actions button.btn-cancel");
      if (!btn) return;

      const card = btn.closest(".myres-card");
      if (!card) return;

      if (btn.disabled) return;
      openCancelForCard(card);
    });

    btnConfirmCancel?.addEventListener("click", () => {
      if (!pendingCancelCard) return;

      pendingCancelCard.dataset.status = "CANCELLED";
      const badge = $(".myres-card-head span.btn", pendingCancelCard);
      if (badge) {
        badge.className = "btn btn-cancel";
        badge.textContent = "Cancelled";
      }

      const btn = getCancelBtn(pendingCancelCard);
      if (btn) btn.disabled = true;

      pendingCancelCard = null;
      closeModal(cancelModal);
      apply();

      if (currentViewCard && currentViewCard === pendingCancelCard) {
        fillViewModal(currentViewCard);
      }
    });

    const fillViewModal = (card) => {
      if (!card) return;

      if (vCode) vCode.textContent = card.dataset.code || "—";
      if (vStatus) vStatus.textContent = statusLabel(card.dataset.status);
      if (vTable) vTable.textContent = card.dataset.table || "—";
      if (vArea) vArea.textContent = areaLabel(card.dataset.area);
      if (vGuests) vGuests.textContent = card.dataset.party || "—";
      if (vTime) vTime.textContent = fmtTime(card.dataset.datetime);

      const note = card.querySelector(".myres-note span")?.textContent || "";
      const noteTa = $("textarea", viewModal);
      if (noteTa) noteTa.value = note;

      if (btnCancelFromView) {
        const st = (card.dataset.status || "").toUpperCase();
        const hide = st === "CANCELLED" || st === "COMPLETED";
        btnCancelFromView.classList.toggle("is-hidden", hide);
        btnCancelFromView.disabled = !canCancel(card);
        btnCancelFromView.title = btnCancelFromView.disabled
          ? `Chỉ hủy khi còn ≥ ${CANCEL_LEAD_MINUTES} phút hoặc không ở trạng thái Completed/Cancelled.`
          : "Hủy đặt";
      }
    };

    grid.addEventListener("click", (e) => {
      const a = e.target.closest(".myres-actions a.btn-light");
      if (!a) return;

      e.preventDefault();

      const card = a.closest(".myres-card");
      if (!card) return;

      currentViewCard = card;
      fillViewModal(card);
      openModal(viewModal);
    });

    btnCancelFromView?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!currentViewCard) return;

      closeModal(viewModal);
      openCancelForCard(currentViewCard);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (cancelModal && !cancelModal.classList.contains("is-hidden")) closeModal(cancelModal);
      if (viewModal && !viewModal.classList.contains("is-hidden")) closeModal(viewModal);
      pendingCancelCard = null;
    });

    apply();
  });
})();
