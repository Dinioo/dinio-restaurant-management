document.addEventListener("DOMContentLoaded", () => {
  const orderList = document.getElementById("orderList");
  const orderEmpty = document.getElementById("orderEmpty");
  const wdOrderCount = document.getElementById("wdOrderCount");

  const kvTable = document.getElementById("kvTable");
  const kvArea = document.getElementById("kvArea");
  const kvSeats = document.getElementById("kvSeats");
  const kvSession = document.getElementById("kvSession");
  const kvCovers = document.getElementById("kvCovers");

  const selOrderPill = document.getElementById("selOrderPill");
  const selOrderId = document.getElementById("selOrderId");
  const selOrderCreatedAt = document.getElementById("selOrderCreatedAt");
  const selOrderStatus = document.getElementById("selOrderStatus");
  const selItemCount = document.getElementById("selItemCount");
  const selItems = document.getElementById("selItems");
  const selItemsEmpty = document.getElementById("selItemsEmpty");

  const params = new URLSearchParams(location.search);
  const tableId = params.get("tableId");
  const btnCreateOrder = document.getElementById("btnCreateOrder");
  if (btnCreateOrder && tableId) {
    btnCreateOrder.href = `/dinio/waiter/order?tableId=${encodeURIComponent(tableId)}&from=orderDetail`;
  }

  let state = {
    table: null,
    session: null,
    orders: [],
    activeOrderId: null
  };

  if (!tableId) {
    toast("Thiếu tableId trên URL. Ví dụ: /waiter/order-detail?tableId=1", true);
    return;
  }

  load();

  async function load() {
    try {
      const res = await fetch(`/dinio/waiter/api/order-detail?tableId=${encodeURIComponent(tableId)}`, {
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      state.table = data.table || null;
      state.session = data.session || null;
      state.orders = Array.isArray(data.orders) ? data.orders : [];
      state.activeOrderId = state.orders.length ? state.orders[0].id : null;

      renderOverview();
      renderOrders();
      renderSelected();

    } catch (e) {
      toast(`Không tải được dữ liệu: ${e.message}`, true);
    }
  }

  function renderOverview() {
    const t = state.table;
    const s = state.session;

    kvTable.textContent = t ? `${t.code || "—"} (#${t.id})` : "—";
    kvArea.textContent = t ? (t.areaName || "—") : "—";
    kvSeats.textContent = t && t.seats != null ? `${t.seats}` : "—";
    kvSession.textContent = s ? `#${s.id} • ${s.status || "—"} • ${s.openedAt || "—"}` : "Chưa có session OPEN";
    kvCovers.textContent = s && s.covers != null ? `${s.covers}` : "—";
  }

  function renderOrders() {
    orderList.innerHTML = "";

    wdOrderCount.textContent = `${state.orders.length} orders`;
    orderEmpty.classList.toggle("is-hidden", state.orders.length > 0);

    state.orders.forEach((o) => {
      const row = document.createElement("div");
      row.className = "wd-order-row";
      row.dataset.id = o.id;

      if (o.id === state.activeOrderId) row.classList.add("is-active", "is-open");

      const itemCount = Array.isArray(o.items) ? o.items.length : 0;

      row.innerHTML = `
        <button class="wd-order-btn" type="button">
          <div class="wd-order-l">
            <div class="wd-order-id">ORD-${o.id}</div>
            <div class="wd-order-sub">
              <span>${o.createdAt || "—"}</span>
              <span class="wd-pill">${o.status || "—"}</span>
              <span>${itemCount} món</span>
            </div>
          </div>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div class="wd-order-items-mini"></div>
      `;

      const mini = row.querySelector(".wd-order-items-mini");
      mini.innerHTML = (o.items || []).map(it => {
        const price = formatMoney(it.unitPrice);
        const note = it.note ? ` • ${escapeHtml(it.note)}` : "";
        return `
          <div class="mini-item">
            <div>
              <div class="mini-name">${escapeHtml(it.menuItemName || "—")}</div>
              <div class="mini-sub">x${it.qty ?? 0}${note}</div>
            </div>
            <div class="wd-pill">${it.status || "—"}</div>
          </div>
        `;
      }).join("");

      row.querySelector(".wd-order-btn").addEventListener("click", () => {
        const isSame = state.activeOrderId === o.id;

        state.activeOrderId = o.id;

        document.querySelectorAll(".wd-order-row").forEach(el => {
          el.classList.remove("is-active", "is-open");
        });

        row.classList.add("is-active");
        row.classList.toggle("is-open", !isSame ? true : !row.classList.contains("is-open"));

        renderSelected();
      });

      orderList.appendChild(row);
    });
  }

  function renderSelected() {
    const o = state.orders.find(x => x.id === state.activeOrderId) || null;

    if (!o) {
      selOrderPill.textContent = "—";
      selOrderId.textContent = "—";
      selOrderCreatedAt.textContent = "—";
      selOrderStatus.textContent = "—";
      selItemCount.textContent = "—";
      selItems.innerHTML = "";
      selItemsEmpty.classList.remove("is-hidden");
      return;
    }

    selOrderPill.textContent = o.status || "—";
    selOrderId.textContent = `ORD-${o.id}`;
    selOrderCreatedAt.textContent = o.createdAt || "—";
    selOrderStatus.textContent = o.status || "—";

    const items = Array.isArray(o.items) ? o.items : [];
    selItemCount.textContent = `${items.length} món`;

    selItemsEmpty.classList.toggle("is-hidden", items.length > 0);

    selItems.innerHTML = items.map(it => {
      const unit = formatMoney(it.unitPrice);
      const total = formatMoney(mulMoney(it.unitPrice, it.qty));
      const note = it.note ? `• ${escapeHtml(it.note)}` : "";
      return `
        <div class="it-row">
          <div class="it-l">
            <div class="it-name">${escapeHtml(it.menuItemName || "—")}</div>
            <div class="it-sub">
              <span>x${it.qty ?? 0}</span>
              <span>${unit}/món</span>
              <span class="wd-pill">${it.status || "—"}</span>
              ${note ? `<span>${note}</span>` : ""}
            </div>
          </div>
          <div class="it-price">${total}</div>
        </div>
      `;
    }).join("");
  }

  function toast(msg, danger) {
    Toastify({
      text: msg,
      duration: 2500,
      close: true,
      gravity: "top",
      position: "right",
      style: danger ? { background: "rgba(220,38,38,.95)" } : { background: "rgba(34,197,94,.95)" }
    }).showToast();
  }

  function formatMoney(v) {
    if (v == null) return "0đ";
    const n = typeof v === "number" ? v : Number(String(v));
    if (Number.isNaN(n)) return "0đ";
    return Math.round(n).toLocaleString("vi-VN") + "đ";
  }

  function mulMoney(unitPrice, qty) {
    const u = unitPrice == null ? 0 : Number(String(unitPrice));
    const q = qty == null ? 0 : Number(String(qty));
    if (Number.isNaN(u) || Number.isNaN(q)) return 0;
    return u * q;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
