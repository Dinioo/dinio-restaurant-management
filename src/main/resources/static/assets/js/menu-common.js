(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const norm = (s) => (s || "").toString().trim().toLowerCase();
  const formatVND = (n) => {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return "0đ";
    return num.toLocaleString("vi-VN") + "đ";
  };

  const buildDishWrap = (item) => {
    const wrap = document.createElement("div");
    wrap.className = "dish-wrap";

    const tagsCsv = (item.tags || []).map(norm).join(",");
    const searchText = norm(
      [item.name, item.description, item.ingredients].filter(Boolean).join(" ")
    );

    wrap.dataset.cat = String(item.categoryId);
    wrap.dataset.tags = tagsCsv;
    wrap.dataset.name = searchText;
    wrap.dataset.price = String(item.price ?? 0);
    wrap.dataset.new = item.isNew ? "1" : "0";

    wrap.innerHTML = `
      <article class="dish-card">
        <div class="dish-hero">
          <img class="dish-img" src="${item.imageUrl || "/assets/pic/preview.jpeg"}" alt="${item.name || "Dish"}"/>
          ${item.isNew ? `<span class="dish-badge">New</span>` : ""}
        </div>
        <div class="dish-body">
          <div class="dish-top">
            <h4 class="dish-name">${item.name || "—"}</h4>
            <div class="dish-price">${formatVND(item.price)}</div>
          </div>
          <p class="dish-desc">${item.description || ""}</p>
        </div>
      </article>
    `;
    return wrap;
  };

  const buildSection = (cat) => {
    const sec = document.createElement("section");
    sec.className = "menu-section";
    sec.dataset.section = String(cat.id);

    sec.innerHTML = `
      <div class="menu-section-head">
        <h3>${cat.name}</h3>
        <span class="section-hint"></span>
      </div>
      <div class="menu-grid"></div>
    `;
    return sec;
  };

  const buildCatButton = (catId, label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "side-tab";
    btn.dataset.cat = String(catId);
    btn.textContent = label;
    return btn;
  };

  const buildTagChip = (tag) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.tag = norm(tag);
    btn.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    return btn;
  };

  // Core init
  window.initMenuPage = async function initMenuPage({ view = "customer" } = {}) {
    const catTabs = $("#menuCatTabs");
    const tagChips = $("#menuTagChips");
    const sectionsWrap = $("#menuSections");

    const input = $("#menuSearch");
    const clearBtn = $(".search-clear");
    const sortSel = $(".menu-sort");
    const countEl = $(".menu-count b");

    if (!catTabs || !tagChips || !sectionsWrap) return;

    const params = new URLSearchParams(location.search);
    const state = {
      cat: params.get("cat") ? String(params.get("cat")).trim() : "all",
      tag: params.get("tag") ? norm(params.get("tag")) : null,
      q: params.get("q") ? norm(params.get("q")) : "",
      sort: params.get("sort") ? String(params.get("sort")).trim() : (sortSel?.value || "recommended"),
    };

    if (input && state.q) input.value = state.q;
    if (sortSel && state.sort) sortSel.value = state.sort;

    const qs = new URLSearchParams();

    qs.set("view", view);

    const urlCat = new URLSearchParams(location.search).get("cat");
    if (urlCat) {
      qs.set("cat", urlCat);
    }

    if (state.sort) qs.set("sort", state.sort);

    const res = await fetch(`/dinio/api/menu/page-data?${qs.toString()}`);
    const data = await res.json();

    if (data && data.cat != null) {
      state.cat = String(data.cat);
    }
    // render cats
    catTabs.innerHTML = "";
    const btnAll = buildCatButton("all", "All");
    catTabs.appendChild(btnAll);

    (data.categories || []).forEach((c) => {
      catTabs.appendChild(buildCatButton(c.id, c.name));
    });

    // render tags
    tagChips.innerHTML = "";
    (data.tags || []).forEach((t) => {
      tagChips.appendChild(buildTagChip(t));
    });

    // render sections + items
    sectionsWrap.innerHTML = "";
    const sectionMap = new Map();

    (data.categories || []).forEach((c) => {
      const sec = buildSection(c);
      sectionsWrap.appendChild(sec);
      sectionMap.set(String(c.id), sec);
    });

    (data.items || []).forEach((it) => {
      const sec = sectionMap.get(String(it.categoryId));
      const grid = sec ? $(".menu-grid", sec) : null;
      if (!grid) return;
      grid.appendChild(buildDishWrap(it));
    });

    // collect nodes after render
    const catBtns = $$(".side-tab", catTabs);
    const tagBtns = $$(".chip", tagChips);
    const items = $$(".dish-wrap", sectionsWrap);
    const grids = $$(".menu-grid", sectionsWrap);

    const parseTags = (s) => norm(s).split(",").map(x => x.trim()).filter(Boolean);
    const getPrice = (el) => Number(el.dataset.price || 0) || 0;

    const setActive = (list, el) => {
      list.forEach(x => x.classList.remove("is-active"));
      el.classList.add("is-active");
    };

    const applyFilter = () => {
      let visible = 0;

      items.forEach(el => {
        const cat = (el.dataset.cat || "all").toString().trim();
        const tags = parseTags(el.dataset.tags || "");
        const name = norm(el.dataset.name || el.textContent);

        const okCat = (state.cat === "all") || (cat === state.cat);
        const okTag = (!state.tag) || tags.includes(state.tag);
        const okQ = (!state.q) || name.includes(state.q);

        const show = okCat && okTag && okQ;
        el.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });

      // hide empty sections
      $$(".menu-section", sectionsWrap).forEach(sec => {
        const anyVisible = $$(".dish-wrap:not(.is-hidden)", sec).length > 0;
        sec.style.display = anyVisible ? "" : "none";
      });

      if (countEl) countEl.textContent = String(visible);
      if (clearBtn) clearBtn.style.display = state.q ? "inline-flex" : "none";
    };

    const applySort = () => {
      if (!sortSel) return;
      const mode = state.sort;

      grids.forEach(grid => {
        const children = Array.from(grid.querySelectorAll(":scope > .dish-wrap"));
        const sorted = children.sort((a, b) => {
          if (mode === "low") return getPrice(a) - getPrice(b);
          if (mode === "high") return getPrice(b) - getPrice(a);
          if (mode === "newest") return (Number(b.dataset.new || 0) - Number(a.dataset.new || 0));
          return 0;
        });

        if (mode !== "recommended") sorted.forEach(el => grid.appendChild(el));
      });
    };

    const applyAll = () => {
      applyFilter();
      applySort();
    };

    // sync active states
    const activeCatBtn = catBtns.find(b => (b.dataset.cat || "all") === state.cat);
    if (activeCatBtn) setActive(catBtns, activeCatBtn);
    if (state.tag) {
      const activeTagBtn = tagBtns.find(b => norm(b.dataset.tag) === state.tag);
      if (activeTagBtn) activeTagBtn.classList.add("is-active");
    }

    // bind events
    catBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        state.cat = (btn.dataset.cat || "all").toString().trim();
        setActive(catBtns, btn);
        applyAll();

        if (state.cat !== "all") {
          const sec = $(`.menu-section[data-section="${state.cat}"]`, sectionsWrap);
          if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    tagBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const t = norm(btn.dataset.tag || "");
        if (!t) return;

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

    applyAll();
  };
})();
