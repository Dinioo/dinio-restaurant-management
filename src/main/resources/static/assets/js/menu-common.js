(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const norm = (s) => (s || "").toString().trim().toLowerCase();
  const formatVND = (n) => {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return "0đ";
    return num.toLocaleString("vi-VN") + "đ";
  };

  const getImageUrl = (item) => {
    const raw =
      item?.imageUrl ??
      item?.image ??
      item?.image_url ??
      item?.thumbnailUrl ??
      item?.thumbUrl ??
      item?.photoUrl ??
      null;

    if (!raw) return "/assets/pic/preview.jpeg";

    const val = typeof raw === "string" ? raw : (raw.url || raw.path || "");
    if (!val) return "/assets/pic/preview.jpeg";

    if (/^https?:\/\//i.test(val)) return val;
    if (val.startsWith("/")) return val;
    return "/" + val.replace(/^\.\//, "");
  };


  // ===== Dish detail modal (MenuItem) =====
  const escapeAttr = (s) => (s == null ? "" : String(s))
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const parseList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    const s = String(v).trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(x => String(x).trim()).filter(Boolean);
      } catch (_) {}
    }
    return s.split(",").map(x => x.trim()).filter(Boolean);
  };

  const labelSpice = (key) => {
    const k = norm(key);
    if (k === "not_spicy") return "Không cay";
    if (k === "mild") return "Cay nhẹ";
    if (k === "medium") return "Cay vừa";
    if (k === "hot") return "Cay nhiều";
    return key ? String(key) : "—";
  };

  const labelItemTag = (key) => {
    const k = norm(key);
    if (k === "best") return "Bán chạy";
    if (k === "new") return "Mới";
    if (k === "signature") return "Signature";
    if (k === "premium") return "Cao cấp";
    return key ? String(key) : "";
  };

  const labelAllergen = (key) => {
    const k = norm(key);
    if (k === "peanuts") return "Đậu phộng";
    if (k === "tree_nuts") return "Hạt cây";
    if (k === "milk") return "Sữa";
    if (k === "eggs") return "Trứng";
    if (k === "wheat_gluten") return "Gluten/Lúa mì";
    if (k === "soy") return "Đậu nành";
    if (k === "fish") return "Cá";
    if (k === "shellfish") return "Hải sản có vỏ";
    return key ? String(key) : "";
  };

  const normalizeImageUrl = (url) => {
    const s = (url || "").toString().trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("/")) return s;
    return "/" + s.replace(/^\.\//, "");
  };

  const renderChips = (wrap, keys, labelFn) => {
    if (!wrap) return;
    wrap.innerHTML = "";
    keys.forEach((k) => {
      const chip = document.createElement("span");
      chip.className = "dish-chip";
      chip.textContent = labelFn(k) || k;
      wrap.appendChild(chip);
    });
  };

  const hideDishModal = () => {
    const modal = document.getElementById("dishModal");
    if (!modal) return;
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  const showDishModal = (dish) => {
    const modal = document.getElementById("dishModal");
    if (!modal) return;

    const img = modal.querySelector("#dishModalImg");
    const badge = modal.querySelector("#dishModalBadge");
    const nameEl = modal.querySelector("#dishModalName");
    const descEl = modal.querySelector("#dishModalDesc");
    const priceEl = modal.querySelector("#dishModalPrice");

    const calEl = modal.querySelector("#dishModalCalories");
    const spiceEl = modal.querySelector("#dishModalSpice");
    const ingEl = modal.querySelector("#dishModalIngredients");

    const tagsBlock = modal.querySelector("#dishModalTagsBlock");
    const tagsWrap = modal.querySelector("#dishModalTags");
    const alBlock = modal.querySelector("#dishModalAllergensBlock");
    const alWrap = modal.querySelector("#dishModalAllergens");
    const ingBlock = modal.querySelector("#dishModalIngredientsBlock");

    // Core
    if (img) {
      img.src = normalizeImageUrl(dish.imageUrl) || "/assets/pic/preview.jpeg";
      img.alt = dish.name || "Dish image";
    }
    if (nameEl) nameEl.textContent = dish.name || "—";
    if (descEl) descEl.textContent = dish.description || "Chưa có mô tả";
    if (priceEl) priceEl.textContent = formatVND(dish.price);

    // Extra fields (exclude id/category/isActive/isAvailable)
    if (calEl) calEl.textContent = (dish.calories != null && dish.calories !== "") ? `${dish.calories} kcal` : "—";
    if (spiceEl) spiceEl.textContent = dish.spiceLevel ? labelSpice(dish.spiceLevel) : "—";

    if (badge) {
      const k = norm(dish.spiceLevel);
      badge.textContent = (dish.spiceLevel && k && k !== "not_spicy") ? labelSpice(dish.spiceLevel) : "";
    }

    const ingText = (dish.ingredients || "").toString().trim();
    if (ingEl) ingEl.textContent = ingText || "—";
    if (ingBlock) ingBlock.style.display = ingText ? "" : "none";

    const tags = parseList(dish.tags);
    if (tagsWrap) renderChips(tagsWrap, tags, labelItemTag);
    if (tagsBlock) tagsBlock.style.display = tags.length ? "" : "none";

    const allergens = parseList(dish.allergens);
    if (alWrap) renderChips(alWrap, allergens, labelAllergen);
    if (alBlock) alBlock.style.display = allergens.length ? "" : "none";

    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };

  const ensureDishModalBindings = () => {
    if (window.__dishModalBound) return;
    window.__dishModalBound = true;

    // Close: backdrop / X / buttons
    document.addEventListener("click", (e) => {
      const closeEl = e.target.closest("[data-close]");
      if (closeEl) {
        const modal = closeEl.closest(".fp-modal");
        if (modal && modal.id === "dishModal") hideDishModal();
        return;
      }

      // Open detail
      const btn = e.target.closest("[data-action='detail'], .js-dish-detail");
      if (!btn) return;

      // Prefer dataset on the button; fallback to closest card
      const host = (btn.dataset && (btn.dataset.name || btn.dataset.priceRaw)) ? btn : (btn.closest(".dish-card") || btn);

      const dish = {
        name: host.dataset.name || host.dataset.title || "",
        description: host.dataset.desc || "",
        price: host.dataset.priceRaw || host.dataset.price || "",
        imageUrl: host.dataset.image || host.dataset.img || "",
        calories: host.dataset.calories || "",
        ingredients: host.dataset.ingredients || "",
        spiceLevel: host.dataset.spice || host.dataset.spiceLevel || "",
        tags: host.dataset.tags || "",
        allergens: host.dataset.allergens || "",
      };

      showDishModal(dish);
    });

    // ESC close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideDishModal();
    });
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
      <article class="dish-card"
               data-title="${item.name || "—"}"
               data-desc="${(item.description || "").replaceAll('"', "&quot;")}"
               data-price="${formatVND(item.price)}"
               data-price-raw="${escapeAttr(item.price ?? 0)}"
               data-img="${getImageUrl(item)}"
               data-ingredients="${escapeAttr(item.ingredients ?? "")}"
               data-calories="${escapeAttr(item.calories ?? "")}"
               data-spice="${escapeAttr(item.spiceLevel ?? "")}"
               data-tags="${escapeAttr((item.tags || []).join(","))}"
               data-allergens="${escapeAttr((item.allergens || []).join(","))}"
               data-badge="${item.isNew ? "New" : ""}">
        <div class="dish-media">
          <img src="${getImageUrl(item)}" alt="${item.name || "Dish"}" loading="lazy"/>
          <span class="dish-badge">${item.isNew ? "New" : ""}</span>
        </div>

        <div class="dish-body">
          <h4 class="dish-title">${item.name || "—"}</h4>
          <p class="dish-desc">${item.description || ""}</p>

          <div class="dish-foot">
            <span class="dish-price">${formatVND(item.price)}</span>
            <button type="button"
                    class="btn btn-order js-dish-detail"
                    data-action="detail"
                    data-id="${item.id ?? ""}"
                    data-name="${escapeAttr(item.name || "")}"
                    data-desc="${escapeAttr(item.description || "")}"
                    data-price-raw="${escapeAttr(item.price ?? 0)}"
                    data-image="${escapeAttr(getImageUrl(item))}"
                    data-calories="${escapeAttr(item.calories ?? "")}"
                    data-ingredients="${escapeAttr(item.ingredients ?? "")}"
                    data-spice="${escapeAttr(item.spiceLevel ?? "")}"
                    data-tags="${escapeAttr((item.tags || []).join(","))}"
                    data-allergens="${escapeAttr((item.allergens || []).join(","))}">
              Chi tiết
            </button>
          </div>
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

    // modal bindings (open/close)
    ensureDishModalBindings();

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
