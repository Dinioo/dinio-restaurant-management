(function () {
  // ===== selectors (match your HTML/CSS) =====
  const catBtns  = document.querySelectorAll(".side-tab");
  const tagBtns  = document.querySelectorAll(".side-tags .chip");
  const input    = document.querySelector("#menuSearch");
  const clearBtn = document.querySelector(".search-clear");
  const sortSel  = document.querySelector(".menu-sort");
  const countEl  = document.querySelector(".menu-count b");

  // all cards & all grids (for sorting)
  const items = Array.from(document.querySelectorAll(".dish-wrap"));
  const grids = Array.from(document.querySelectorAll(".menu-grid"));

  // ===== state =====
  let state = {
    cat: "all",
    tag: null,
    q: "",
    sort: sortSel ? (sortSel.value || "recommended") : "recommended"
  };

  // ===== helpers =====
  const norm = (s) => (s || "").toString().trim().toLowerCase();
  const parseTags = (s) => norm(s).split(",").map(x => x.trim()).filter(Boolean);
  const getPrice = (el) => {
    // preferred: data-price="149000"
    const v = el.dataset.price;
    if (v) return Number(v) || 0;

    // fallback: try parse from text inside card (optional)
    const text = el.textContent || "";
    const digits = text.replace(/[^\d]/g, "");
    return Number(digits) || 0;
  };

  function setActive(list, el) {
    list.forEach(x => x.classList.remove("is-active"));
    el.classList.add("is-active");
  }

  function applyFilter() {
    let visible = 0;

    items.forEach(el => {
      const cat = (el.dataset.cat || "all").toString().trim();
      const tags = parseTags(el.dataset.tags || "");
      const name = norm(el.dataset.name || el.textContent);

      const okCat = (state.cat === "all") || (cat === state.cat);
      const okTag = (!state.tag) || tags.includes(state.tag);
      const okQ   = (!state.q) || name.includes(state.q);

      const show = okCat && okTag && okQ;
      el.classList.toggle("is-hidden", !show);

      if (show) visible++;
    });

    // hide empty sections (if you use .menu-section wrapper)
    document.querySelectorAll(".menu-section").forEach(sec => {
      const anyVisible = sec.querySelectorAll(".dish-wrap:not(.is-hidden)").length > 0;
      sec.style.display = anyVisible ? "" : "none";
    });

    if (countEl) countEl.textContent = visible;

    // show/hide clear button
    if (clearBtn) clearBtn.style.display = state.q ? "inline-flex" : "none";
  }

  function applySort() {
    if (!sortSel) return;

    const mode = state.sort;

    // sort only within each grid
    grids.forEach(grid => {
      const children = Array.from(grid.querySelectorAll(":scope > .dish-wrap"));

      const sorted = children.sort((a, b) => {
        if (mode === "low")  return getPrice(a) - getPrice(b);
        if (mode === "high") return getPrice(b) - getPrice(a);
        if (mode === "newest") {
          // optional: data-created="2026-01-08" or data-new="1"
          const an = Number(a.dataset.new || 0);
          const bn = Number(b.dataset.new || 0);
          return bn - an;
        }
        // recommended: keep original order (do nothing)
        return 0;
      });

      if (mode !== "recommended") {
        sorted.forEach(el => grid.appendChild(el));
      }
    });
  }

  function applyAll() {
    applyFilter();
    applySort();
  }

  // ===== events =====
  catBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      state.cat = (btn.dataset.cat || "all").toString().trim();
      setActive(catBtns, btn);

      // when changing category, optionally scroll to that section
      applyAll();
      if (state.cat !== "all") {
        const sec = document.querySelector(`.menu-section[data-section="${state.cat}"]`);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  tagBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const t = norm(btn.dataset.tag || "");
      if (!t) return;

      // toggle tag
      if (state.tag === t) {
        state.tag = null;
        btn.classList.remove("is-active");
      } else {
        state.tag = t;
        tagBtns.forEach(x => x.classList.remove("is-active"));
        btn.classList.add("is-active");
      }
      applyAll();
    });
  });

  if (input) {
    input.addEventListener("input", () => {
      state.q = norm(input.value);
      applyAll();
    });
  }

  if (clearBtn && input) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      state.q = "";
      applyAll();
      input.focus();
    });
  }

  if (sortSel) {
    sortSel.addEventListener("change", () => {
      state.sort = sortSel.value || "recommended";
      applyAll();
    });
  }

  // ===== init =====
  // optional: read ?cat=main&tag=best&q=pasta
  const params = new URLSearchParams(location.search);
  if (params.get("cat")) state.cat = params.get("cat").toString().trim();
  if (params.get("tag")) state.tag = norm(params.get("tag"));
  if (params.get("q"))   state.q   = norm(params.get("q"));

  // sync UI
  if (state.q && input) input.value = state.q;

  // activate cat button
  const activeCatBtn = Array.from(catBtns).find(b => (b.dataset.cat || "all").toString().trim() === state.cat);
  if (activeCatBtn) setActive(catBtns, activeCatBtn);

  // activate tag chip
  if (state.tag) {
    const activeTagBtn = Array.from(tagBtns).find(b => norm(b.dataset.tag) === state.tag);
    if (activeTagBtn) activeTagBtn.classList.add("is-active");
  }

  applyAll();
})();

