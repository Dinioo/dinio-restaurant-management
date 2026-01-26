// /assets/js/waiter/waiter-order.js
document.addEventListener("DOMContentLoaded", () => {
  // ===== Toast helper (dùng trực tiếp trong file này) =====
  function showToast(message, type = 'info', duration = 3000) {
    Toastify({
      text: message,
      duration: duration,
      gravity: "top",
      position: "right",
      close: true,
      className: type,
      stopOnFocus: true,
    }).showToast();
  }
  function successToast(msg) { showToast(msg, 'success'); }
  function errorToast(msg)   { showToast(msg, 'error', 1000); }
  function warningToast(msg) { showToast(msg, 'warning', 1000); }
  function infoToast(msg)    { showToast(msg, 'info'); }

  const grid = document.getElementById("menuGrid");
  const search = document.getElementById("menuSearch");
  const catChips = document.getElementById("catChips");

  const orderLinesEl = document.getElementById("orderLines");
  const totalEl = document.getElementById("orderTotal");

  const btnSendKitchen = document.getElementById("btnSendKitchen");

  // ===== TOPPING MODAL refs =====
  const tpModal = document.getElementById("toppingModal");
  const tpDishNameEl = document.getElementById("tpDishName");
  const tpListEl = document.getElementById("tpList");
  const tpTotalEl = document.getElementById("tpTotal");
  const tpConfirmBtn = document.getElementById("tpConfirm");

  // Topping config (m chỉnh sau)
  const TOPPINGS = [
    { id: "tp_pearl",   name: "Trân châu",      price: 10000 },
    { id: "tp_pudding", name: "Pudding",       price: 12000 },
    { id: "tp_cream",   name: "Kem cheese",    price: 15000 },
    { id: "tp_jelly",   name: "Thạch trái cây", price: 8000 },
    { id: "tp_shot",    name: "Extra shot",    price: 15000 },
    { id: "tp_oat",     name: "Sữa yến mạch",  price: 12000 },
  ];

  // cart line item: key => {key, baseId, name, basePrice, qty, toppings:[{id,name,price}]}
  const cart = new Map();

  const vnd = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";

  const lineUnitPrice = (it) => {
    const tp = (it.toppings || []).reduce((s, t) => s + (t.price || 0), 0);
    return (it.basePrice || 0) + tp;
  };

  const computeTotal = () => {
    let total = 0;
    cart.forEach((it) => {
      total += lineUnitPrice(it) * it.qty;
    });
    totalEl.textContent = vnd(total);
  };

  const renderCart = () => {
    orderLinesEl.innerHTML = "";

    if (cart.size === 0) {
      orderLinesEl.innerHTML = `<p style="opacity:.7;margin:0;">Chưa có món nào.</p>`;
      computeTotal();
      return;
    }

    cart.forEach((it) => {
      const unit = lineUnitPrice(it);
      const lineTotal = unit * it.qty;

      const tagsHtml = (it.toppings && it.toppings.length)
        ? `<div class="ol-tags">
             ${it.toppings.map(t => `<span class="wo-tag">+ ${t.name}</span>`).join("")}
           </div>`
        : ``;

      const div = document.createElement("div");
      div.className = "wo-line";
      div.dataset.key = it.key;

      div.innerHTML = `
        <div class="ol-left">
          <p class="ol-name">${it.name}</p>
          <div class="ol-sub">
            <span class="ol-price">${vnd(unit)}/món</span>
            <span style="opacity:.6;">•</span>
            <span>Thành tiền: <b style="color:var(--text-strong);">${vnd(lineTotal)}</b></span>
          </div>
          ${tagsHtml}
        </div>

        <div class="ol-right">
          <div class="wo-qty">
            <button type="button" data-dec="${it.key}" aria-label="Giảm">-</button>
            <b>${it.qty}</b>
            <button type="button" data-inc="${it.key}" aria-label="Tăng">+</button>
          </div>
          <button type="button" class="wo-remove" data-rm="${it.key}" title="Xoá">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      orderLinesEl.appendChild(div);
    });

    computeTotal();
  };

  const addLineItem = ({ baseId, name, basePrice, toppings = [] }) => {
    const tpKey = toppings.map(t => t.id).sort().join("|");
    const key = `${baseId}__${tpKey || "no_tp"}`;

    const cur = cart.get(key);
    if (cur) cur.qty += 1;
    else cart.set(key, { key, baseId, name, basePrice, qty: 1, toppings });

    renderCart();
  };

  // ===== TOPPING MODAL =====
  let pendingDrink = null; // {baseId,name,basePrice}

  const openToppingModal = (drink) => {
    pendingDrink = drink;
    tpDishNameEl.textContent = drink.name;
    tpTotalEl.textContent = vnd(0);

    tpListEl.innerHTML = TOPPINGS.map(t => `
      <label class="wo-tp-item">
        <div class="wo-tp-left">
          <input class="wo-tp-check" type="checkbox"
                 data-tpid="${t.id}" data-name="${t.name}" data-price="${t.price}">
          <span class="wo-tp-name">${t.name}</span>
        </div>
        <span class="wo-tp-price">+ ${vnd(t.price)}</span>
      </label>
    `).join("");

    tpModal.classList.remove("is-hidden");
    tpModal.setAttribute("aria-hidden", "false");
  };

  const closeToppingModal = () => {
    tpModal.classList.add("is-hidden");
    tpModal.setAttribute("aria-hidden", "true");
    pendingDrink = null;
  };

  const calcTpTotal = () => {
    let sum = 0;
    tpListEl.querySelectorAll('input[type="checkbox"]:checked').forEach(ch => {
      sum += Number(ch.dataset.price || 0);
    });
    tpTotalEl.textContent = vnd(sum);
    return sum;
  };

  tpModal?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeToppingModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!tpModal || tpModal.classList.contains("is-hidden")) return;
    if (e.key === "Escape") closeToppingModal();
  });

  tpListEl?.addEventListener("change", () => {
    calcTpTotal();
  });

  tpConfirmBtn?.addEventListener("click", () => {
    if (!pendingDrink) return;

    const selected = [];
    tpListEl.querySelectorAll('input[type="checkbox"]:checked').forEach(ch => {
      selected.push({
        id: ch.dataset.tpid,
        name: ch.dataset.name,
        price: Number(ch.dataset.price || 0),
      });
    });

    addLineItem({
      baseId: pendingDrink.baseId,
      name: pendingDrink.name,
      basePrice: pendingDrink.basePrice,
      toppings: selected,
    });

    closeToppingModal();
  });

  // ===== Add item from menu =====
  grid?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;

    const id = btn.dataset.add;
    const card = grid.querySelector(`.wo-card[data-id="${id}"]`);
    if (!card) return;

    const baseId = card.dataset.id;
    const name = card.dataset.name;
    const basePrice = Number(card.dataset.price || 0);
    const cat = card.dataset.cat;

    if (cat === "drink") {
      openToppingModal({ baseId, name, basePrice });
      return;
    }

    addLineItem({ baseId, name, basePrice, toppings: [] });
  });

  // ===== Cart controls =====
  orderLinesEl?.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rm  = e.target.closest("[data-rm]");

    if (inc) {
      const key = inc.dataset.inc;
      const it = cart.get(key);
      if (it) it.qty += 1;
      renderCart();
      return;
    }

    if (dec) {
      const key = dec.dataset.dec;
      const it = cart.get(key);
      if (it) {
        it.qty -= 1;
        if (it.qty <= 0) cart.delete(key);
      }
      renderCart();
      return;
    }

    if (rm) {
      cart.delete(rm.dataset.rm);
      renderCart();
    }
  });

  // ===== Filter: search + category (+ bestseller chip) =====
  let activeCat = "all";

  const applyFilter = () => {
    const q = (search?.value || "").trim().toLowerCase();
    const cards = grid?.querySelectorAll(".wo-card");
    if (!cards) return;

    cards.forEach((c) => {
      const name = (c.dataset.name || "").toLowerCase();
      const cat = c.dataset.cat || "other";
      const isBest = c.dataset.bestseller === "1";

      const okCat =
        activeCat === "all"
          ? true
          : activeCat === "bestseller"
            ? isBest
            : cat === activeCat;

      const okQ = q ? name.includes(q) : true;

      c.style.display = (okCat && okQ) ? "" : "none";
    });
  };

  search?.addEventListener("input", applyFilter);

  catChips?.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;

    activeCat = chip.dataset.cat || "all";
    catChips.querySelectorAll(".chip").forEach((b) => b.classList.remove("is-active"));
    chip.classList.add("is-active");
    applyFilter();
  });

  // ===== Send kitchen: show toast success (demo) =====
  btnSendKitchen?.addEventListener("click", () => {
    if (cart.size === 0) {
      warningToast("Chưa có món nào để gửi bếp!");
      return;
    }

    // Nếu m chưa nối backend, đây là demo: hiện toast + clear cart
    successToast("Đã gửi bếp thành công!");
    cart.clear();
    renderCart();
  });

  // init
  renderCart();
  applyFilter();
});
