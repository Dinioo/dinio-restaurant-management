document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("menuGrid");
  const search = document.getElementById("menuSearch");
  const catChips = document.getElementById("catChips");

  const orderLinesEl = document.getElementById("orderLines");
  const totalEl = document.getElementById("orderTotal");

  const btnSendKitchen = document.getElementById("btnSendKitchen");
  const btnCancel = document.getElementById("btnCancel");
  const btnBack = document.getElementById("btnBack");

  const woTable = document.getElementById("woTable");
  const woArea = document.getElementById("woArea");
  const woSeats = document.getElementById("woSeats");
  const woSession = document.getElementById("woSession");

  const params = new URLSearchParams(location.search);
  const tableId = params.get("tableId");
  const from = params.get("from");

  function showToast(message, type = "info", duration = 3000) {
    Toastify({
      text: message,
      duration,
      gravity: "top",
      position: "right",
      close: true,
      className: type,
      stopOnFocus: true,
    }).showToast();
  }
  const successToast = (m) => showToast(m, "success");
  const errorToast = (m) => showToast(m, "error", 1400);
  const warningToast = (m) => showToast(m, "warning", 1600);

  const getHeaders = () => {
    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const headers = { "Content-Type": "application/json" };
    if (token && header) headers[header] = token;
    return headers;
  };

  const vnd = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";

  const cart = new Map();

  let activeCat = "all";
  let menuData = { categories: [], items: [] };

  if (!tableId) {
    errorToast("Thiếu tableId");
    return;
  }

  btnCancel?.addEventListener("click", () => {
    window.location.href = `/dinio/waiter/order-detail?tableId=${encodeURIComponent(tableId)}`;
  });

  btnBack?.addEventListener("click", () => {
  if (!tableId) {
    window.location.href = "/dinio/waiter/tables";
    return;
  }

  if (from === "orderDetail") {
    window.location.href =
      `/dinio/waiter/order-detail?tableId=${tableId}`;
  } else {
    window.location.href = "/dinio/waiter/tables";
  }
});

  init();

  async function init() {
    await loadData();
    renderMenu();
    bindMenuClicks();
    bindFilters();
    renderCart();
    applyFilter();
  }

  async function loadData() {
    const res = await fetch(`/dinio/waiter/api/order/new-data?tableId=${encodeURIComponent(tableId)}`, {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      errorToast("Không load được dữ liệu");
      return;
    }

    const data = await res.json();
    const t = data.table || {};
    const s = data.session || null;

    woTable.textContent = t.code ? `${t.code}` : `#${t.id || "—"}`;
    woArea.textContent = t.areaName || "—";
    woSeats.textContent = t.seats != null ? String(t.seats) : "—";
    woSession.textContent = s && s.id ? `#${s.id} (${s.status || "—"})` : "—";

    menuData.categories = Array.isArray(data.categories) ? data.categories : [];
    menuData.items = Array.isArray(data.items) ? data.items : [];
  }

  function renderMenu() {
    grid.innerHTML = "";

    catChips.innerHTML = `<button class="chip is-active" data-cat="all">All</button>`;
    menuData.categories.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.dataset.cat = String(c.id);
      b.type = "button";
      b.textContent = c.name || "—";
      catChips.appendChild(b);
    });

    menuData.items.forEach((it) => {
      const card = document.createElement("article");
      card.className = "po-card wo-card";
      card.dataset.id = String(it.id);
      card.dataset.name = it.name || "";
      card.dataset.price = String(it.price || 0);
      card.dataset.cat = it.categoryId != null ? String(it.categoryId) : "none";

      card.innerHTML = `
        <div class="po-body wo-card-body">
          <div class="po-row wo-row">
            <h4 class="po-title wo-title">${escapeHtml(it.name || "—")}</h4>
            <div class="po-price wo-price">${vnd(it.price || 0)}</div>
          </div>
          <div class="po-actions wo-actions-row">
            <button class="btn-order" type="button" data-add="${it.id}">Thêm</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function bindMenuClicks() {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;

      const id = String(btn.dataset.add);
      const card = grid.querySelector(`.wo-card[data-id="${cssEsc(id)}"]`);
      if (!card) return;

      const menuItemId = Number(card.dataset.id);
      const name = card.dataset.name || "—";
      const price = Number(card.dataset.price || 0);

      const cur = cart.get(menuItemId);
      if (cur) cur.qty += 1;
      else cart.set(menuItemId, { id: menuItemId, name, price, qty: 1, note: "" });

      renderCart();
    });

    orderLinesEl.addEventListener("click", (e) => {
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      const rm = e.target.closest("[data-rm]");

      if (inc) {
        const id = Number(inc.dataset.inc);
        const it = cart.get(id);
        if (it) it.qty += 1;
        renderCart();
        return;
      }

      if (dec) {
        const id = Number(dec.dataset.dec);
        const it = cart.get(id);
        if (it) {
          it.qty -= 1;
          if (it.qty <= 0) cart.delete(id);
        }
        renderCart();
        return;
      }

      if (rm) {
        cart.delete(Number(rm.dataset.rm));
        renderCart();
      }
    });
  }

  function renderCart() {
    orderLinesEl.innerHTML = "";

    if (cart.size === 0) {
      orderLinesEl.innerHTML = `<p style="opacity:.7;margin:0;">Chưa có món nào.</p>`;
      totalEl.textContent = vnd(0);
      return;
    }

    let total = 0;
    cart.forEach((it) => {
      const line = it.price * it.qty;
      total += line;

      const row = document.createElement("div");
      row.className = "wo-line";
      row.innerHTML = `
        <div class="ol-left">
          <p class="ol-name">${escapeHtml(it.name)}</p>
          <div class="ol-sub">
            <span class="ol-price">${vnd(it.price)}/món</span>
            <span style="opacity:.6;">•</span>
            <span>Thành tiền: <b style="color:var(--text-strong);">${vnd(line)}</b></span>
          </div>
        </div>
        <div class="ol-right">
          <div class="wo-qty">
            <button type="button" data-dec="${it.id}" aria-label="Giảm">-</button>
            <b>${it.qty}</b>
            <button type="button" data-inc="${it.id}" aria-label="Tăng">+</button>
          </div>
          <button type="button" class="wo-remove" data-rm="${it.id}" title="Xoá">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
      orderLinesEl.appendChild(row);
    });

    totalEl.textContent = vnd(total);
  }

  function bindFilters() {
    search.addEventListener("input", applyFilter);

    catChips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;

      activeCat = chip.dataset.cat || "all";
      catChips.querySelectorAll(".chip").forEach((b) => b.classList.remove("is-active"));
      chip.classList.add("is-active");
      applyFilter();
    });

    btnSendKitchen.addEventListener("click", async () => {
      if (cart.size === 0) {
        warningToast("Chưa có món nào để gửi bếp!");
        return;
      }

      const payload = {
        items: Array.from(cart.values()).map(it => ({
          menuItemId: it.id,
          qty: it.qty,
          note: it.note || ""
        }))
      };

      const res = await fetch(`/dinio/waiter/api/order/send-kitchen?tableId=${encodeURIComponent(tableId)}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        errorToast(await res.text());
        return;
      }

      successToast("Đã gửi bếp!");
      cart.clear();
      renderCart();

      window.location.href = `/dinio/waiter/order-detail?tableId=${encodeURIComponent(tableId)}`;
    });
  }

  function applyFilter() {
    const q = (search.value || "").trim().toLowerCase();
    const cards = grid.querySelectorAll(".wo-card");

    cards.forEach((c) => {
      const name = (c.dataset.name || "").toLowerCase();
      const cat = c.dataset.cat || "none";

      const okCat = (activeCat === "all") ? true : (cat === activeCat);
      const okQ = q ? name.includes(q) : true;

      c.style.display = (okCat && okQ) ? "" : "none";
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cssEsc(s) {
    return String(s).replaceAll('"', '\\"');
  }
});
