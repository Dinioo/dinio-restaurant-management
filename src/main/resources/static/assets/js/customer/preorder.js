(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // ====== 1) Search clear behavior (match your UI) ======
  const searchInput = $("#menuSearch");
  const clearBtn = $(".search-clear");

  const syncClearBtn = () => {
    if (!clearBtn || !searchInput) return;
    const has = (searchInput.value || "").trim().length > 0;
    clearBtn.style.display = has ? "grid" : "none";
  };

  if (searchInput && clearBtn) {
    syncClearBtn();

    searchInput.addEventListener("input", () => {
      syncClearBtn();
      // optional: you can filter dish cards here later
      updateCount();
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.focus();
      syncClearBtn();
      // optional: reset filter
      $$(".dish-wrap").forEach(el => el.classList.remove("is-hidden"));
      updateCount();
    });
  }

  // ====== 2) Sidebar reservation info (fake data for FE test) ======
  const pick = {
    code: $("#pickCode"),
    table: $("#pickTable"),
    area: $("#pickArea"),
    seats: $("#pickSeats"),
    time: $("#pickTime")
  };

  const setPick = ({ code, table, area, seats, time }) => {
    if (pick.code) pick.code.textContent = code ?? "—";
    if (pick.table) pick.table.textContent = table ?? "—";
    if (pick.area) pick.area.textContent = area ?? "—";
    if (pick.seats) pick.seats.textContent = seats ?? "—";
    if (pick.time) pick.time.textContent = time ?? "—";
  };

  // FE test: auto fill demo reservation if fields exist
  if (pick.table || pick.area || pick.seats || pick.time || pick.code) {
    setPick({
      code: "RSV-2026-013",
      table: "T03",
      area: "Tầng 1",
      seats: "4",
      time: "2026-01-16 • 20:15"
    });
  }

  const btnClearPick = $("#btnClearPick");
  if (btnClearPick) {
    btnClearPick.addEventListener("click", () => {
      setPick({ code: "—", table: "—", area: "—", seats: "—", time: "—" });
    });
  }

  // ====== 3) Count items (match .menu-count) ======
  const countEl = $(".menu-count b");

  function updateCount() {
    if (!countEl) return;
    const visible = $$(".dish-wrap").filter(el => !el.classList.contains("is-hidden"));
    countEl.textContent = String(visible.length);
  }

  updateCount();

  // ====== 4) Optional simple search filter (by data-name) ======
  // You already store data-name in .dish-wrap. This is FE-only.
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = (searchInput.value || "").trim().toLowerCase();

      $$(".dish-wrap").forEach(el => {
        const name = (el.dataset.name || "").toLowerCase();
        const show = !q || name.includes(q);
        el.classList.toggle("is-hidden", !show);
      });

      updateCount();
    });
  }
})();
