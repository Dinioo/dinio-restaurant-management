(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

  const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

  const searchInput = qs("#menuSearch");
  const btnClearSearch = qs("#btnClearSearch");
  const sortSelect = qs("#menuSort");

  const catWrap = qs("#catChips");
  const tagWrap = qs("#tagToggles");

  const countShownEl = qs("#countShown");

  const cartList = qs("#cartList");
  const cartSubtotalEl = qs("#cartSubtotal");
  const cartCountEl = qs("#cartCount");

  const btnClearCart = qs("#btnClearCart");
  const btnCheckout = qs("#btnGoCheckout");

  const hasMenu = !!qs("#menuSections");
  if (!hasMenu) return;

  const CART_KEY = "dinio_preorder_cart_v3";

  let activeCat = "all";
  let activeTags = new Set();
  let query = "";
  let sortBy = (sortSelect?.value || "recommended");

  let cart = safeParse(localStorage.getItem(CART_KEY)) || {};

  const allCards = () => qsa(".po-card");
  const allSections = () => qsa(".po-section");

  function cardData(card) {
    const price = Number(card.dataset.price || 0);
    const name = (card.dataset.name || card.querySelector(".po-title")?.textContent || "").trim();
    const img = card.querySelector("img")?.getAttribute("src") || "";

    const tags = (card.dataset.tags || "")
      .toLowerCase()
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    return {
      id: card.dataset.id,
      name,
      price,
      img,
      cat: (card.dataset.cat || "").toLowerCase(),
      tags,
      isNew: card.dataset.new === "1",
      recommended: card.dataset.recommended === "1",
    };
  }

  function matchCard(card) {
    const d = cardData(card);

    if (activeCat !== "all" && d.cat !== activeCat) return false;

    if (activeTags.size > 0) {
      const ok = d.tags.some(t => activeTags.has(t));
      if (!ok) return false;
    }

    if (query) {
      const hay = (d.name + " " + (card.textContent || "")).toLowerCase();
      if (!hay.includes(query)) return false;
    }

    return true;
  }

  function sortCards(cards) {
    return cards.sort((a, b) => {
      const A = cardData(a);
      const B = cardData(b);

      if (sortBy === "low") return A.price - B.price;
      if (sortBy === "high") return B.price - A.price;
      if (sortBy === "newest") return (B.isNew ? 1 : 0) - (A.isNew ? 1 : 0);

      const ra = A.recommended ? 1 : 0;
      const rb = B.recommended ? 1 : 0;
      if (rb !== ra) return rb - ra;
      return A.price - B.price;
    });
  }

  function applyFilterAndSort() {
    const cards = allCards();

    cards.forEach(card => {
      card.style.display = matchCard(card) ? "" : "none";
    });

    allSections().forEach(section => {
      const grid = qs(".po-grid", section);
      if (!grid) return;

      const visible = qsa(".po-card", grid).filter(c => c.style.display !== "none");
      const hidden = qsa(".po-card", grid).filter(c => c.style.display === "none");

      sortCards(visible);

      const frag = document.createDocumentFragment();
      visible.forEach(c => frag.appendChild(c));
      hidden.forEach(c => frag.appendChild(c));
      grid.appendChild(frag);

      section.style.display = visible.length ? "" : "none";
    });

    const shown = cards.filter(c => c.style.display !== "none").length;
    if (countShownEl) countShownEl.textContent = String(shown);
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCartById(id) {
    const card = qs(`.po-card[data-id="${CSS.escape(id)}"]`);
    if (!card) return;

    const d = cardData(card);
    if (!cart[id]) cart[id] = { id: d.id, name: d.name, price: d.price, img: d.img, qty: 0 };
    cart[id].qty += 1;

    renderCart();
  }

  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
    renderCart();
  }

  function clearCart() {
    cart = {};
    renderCart();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureCartListContainer() {
    let list = qs("#cartItems");
    if (!list) {
      list = document.createElement("div");
      list.id = "cartItems";
      list.style.display = "grid";
      list.style.gap = "10px";
      list.style.margin = "10px 0 0";
      const head = qs(".po-cart-head");
      if (head && head.parentElement) head.insertAdjacentElement("afterend", list);
    }
    return list;
  }

  function renderCart() {
    const items = Object.values(cart);
    const list = ensureCartListContainer();

    list.innerHTML = "";

    let subtotal = 0;
    let count = 0;

    items.forEach(it => {
      subtotal += it.price * it.qty;
      count += it.qty;

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-thumb"><img src="${it.img}" alt=""></div>
        <div class="cart-info">
          <p class="cart-name">${escapeHtml(it.name)}</p>
          <div class="cart-sub">
            <span>${fmt(it.price)}</span>
            <div class="qty">
              <button type="button" data-dec="${it.id}" aria-label="Giảm">−</button>
              <b>${it.qty}</b>
              <button type="button" data-inc="${it.id}" aria-label="Tăng">+</button>
            </div>
          </div>
        </div>
      `;
      list.appendChild(row);
    });

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "po-empty";
      empty.innerHTML = `<p>Chưa có món nào.</p><span>Chọn món bên phải để bếp chuẩn bị sẵn.</span>`;
      list.appendChild(empty);
    }

    if (cartSubtotalEl) cartSubtotalEl.textContent = fmt(subtotal);
    if (cartCountEl) cartCountEl.textContent = String(count);

    saveCart();
  }

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) return addToCartById(add.dataset.add);

    const quick = e.target.closest("[data-quick]");
    if (quick) return addToCartById(quick.dataset.quick);

    const inc = e.target.closest("[data-inc]");
    if (inc) return changeQty(inc.dataset.inc, +1);

    const dec = e.target.closest("[data-dec]");
    if (dec) return changeQty(dec.dataset.dec, -1);

    const chip = e.target.closest("#catChips .chip");
    if (chip) {
      qsa("#catChips .chip").forEach(b => b.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeCat = (chip.dataset.cat || "all").toLowerCase();
      applyFilterAndSort();
      return;
    }

    const tag = e.target.closest("#tagToggles .tag");
    if (tag) {
      const t = (tag.dataset.tag || "").toLowerCase();
      if (!t) return;

      if (activeTags.has(t)) {
        activeTags.delete(t);
        tag.classList.remove("is-active");
      } else {
        activeTags.add(t);
        tag.classList.add("is-active");
      }
      applyFilterAndSort();
      return;
    }
  });

  function updateClearBtn() {
    const show = !!(searchInput?.value?.trim());
    if (btnClearSearch) btnClearSearch.style.display = show ? "grid" : "none";
  }

  searchInput?.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    updateClearBtn();
    applyFilterAndSort();
  });

  btnClearSearch?.addEventListener("click", () => {
    searchInput.value = "";
    query = "";
    updateClearBtn();
    applyFilterAndSort();
    searchInput.focus();
  });

  sortSelect?.addEventListener("change", () => {
    sortBy = sortSelect.value || "recommended";
    applyFilterAndSort();
  });

  btnClearCart?.addEventListener("click", () => {
    clearCart();
  });

  btnCheckout?.addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
      alert("Bạn chưa chọn món nào.");
      return;
    }
    console.log("PREORDER PAYLOAD:", Object.values(cart));
    alert("Đã chuẩn bị payload ✅ (xem console). Bạn nối endpoint backend là xong.");
  });

  updateClearBtn();
  renderCart();
  applyFilterAndSort();
})();
