document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const state = {
    tableId: null,
    sessionId: null,
    method: "CASH",
    bill: null
  };

  const el = {
    sumTable: $("#sumTable"),
    sumSession: $("#sumSession"),
    refreshBtn: $("#refreshBtn"),

    billMeta: $("#billMeta"),
    billStatus: $("#billStatus"),

    rTable: $("#rTable"),
    rTime: $("#rTime"),
    rCashier: $("#rCashier"),
    rMethod: $("#rMethod"),
    rLines: $("#rLines"),
    rSubTotal: $("#rSubTotal"),
    rService: $("#rService"),
    rVat: $("#rVat"),
    rTotal: $("#rTotal"),
    rNote: $("#rNote"),

    sSubTotal: $("#sSubTotal"),
    sService: $("#sService"),
    sVat: $("#sVat"),
    sTotal: $("#sTotal"),

    payMethods: $("#payMethods"),
    btnPrint: $("#btnPrint"),
    btnPay: $("#btnPay"),
    payHint: $("#payHint"),
    noteInput: $("#noteInput")
  };

  function money(n) {
    const x = Number(n || 0);
    return x.toLocaleString("vi-VN");
  }

  function toast(msg) {
    if (!window.Toastify) return alert(msg);
    Toastify({ text: msg, duration: 2200, gravity: "top", position: "right" }).showToast();
  }

  function setButtonsEnabled(on) {
    el.btnPrint.disabled = !on;
    el.btnPay.disabled = !on;
    el.payHint.textContent = on ? "Sẵn sàng in bill hoặc xác nhận thanh toán." : "Chọn bàn hợp lệ để bật thao tác.";
  }

  function renderBill(bill) {
    if (!bill) return;

    el.sumTable.textContent = bill.tableName || "—";
    el.sumSession.textContent = bill.sessionId || "—";

    el.billMeta.textContent = `Bàn ${bill.tableName || "—"} • ${bill.openedAt || "—"}`;
    el.billStatus.textContent = bill.statusLabel || "Tạm tính";

    el.rTable.textContent = bill.tableName || "—";
    el.rTime.textContent = bill.printTime || new Date().toLocaleString("vi-VN");
    el.rCashier.textContent = bill.cashierName || "—";
    el.rMethod.textContent = methodLabel(state.method);

    el.rLines.innerHTML = "";
    (bill.items || []).forEach(it => {
      const row = document.createElement("div");
      row.className = "br-line";
      row.innerHTML = `
        <div>${escapeHtml(it.name || "—")}</div>
        <div class="br-right">${Number(it.qty || 0)}</div>
        <div class="br-right">${money(it.lineTotal || 0)}</div>
      `;
      el.rLines.appendChild(row);
    });

    el.rSubTotal.textContent = money(bill.subtotal);
    el.rService.textContent = money(bill.serviceFee);
    el.rVat.textContent = money(bill.vat);
    el.rTotal.textContent = money(bill.total);

    el.sSubTotal.textContent = money(bill.subtotal);
    el.sService.textContent = money(bill.serviceFee);
    el.sVat.textContent = money(bill.vat);
    el.sTotal.textContent = money(bill.total);

    el.rNote.textContent = bill.note || "* Bill tạm tính";

    setButtonsEnabled(true);
  }

  function methodLabel(m) {
    if (m === "CASH") return "Tiền mặt";
    if (m === "CARD") return "Thẻ";
    if (m === "QR") return "QR / CK";
    return "—";
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function readQuery() {
    const u = new URL(window.location.href);
    const tableId = u.searchParams.get("tableId");
    const sessionId = u.searchParams.get("sessionId");
    state.tableId = tableId;
    state.sessionId = sessionId;
  }

  async function fetchBillPreview() {
    if (!state.tableId && !state.sessionId) {
      setButtonsEnabled(false);
      return;
    }

    // TODO: đổi endpoint theo controller của bạn
    // Ưu tiên: /api/cashier/bill/preview?sessionId=... hoặc ?tableId=...
    const qs = new URLSearchParams();
    if (state.sessionId) qs.set("sessionId", state.sessionId);
    else qs.set("tableId", state.tableId);

    try {
      const res = await fetch(`/dinio/api/cashier/bill/preview?${qs.toString()}`, {
        headers: buildCsrfHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bill = await res.json();
      state.bill = bill;
      renderBill(bill);
    } catch (e) {
      setButtonsEnabled(false);
      toast("Không tải được bill tạm tính.");
      console.error(e);
    }
  }

  async function finalizePayment() {
    if (!state.bill) return;

    // TODO: đổi endpoint theo controller của bạn
    // body cần: sessionId/tableId + paymentMethod + note
    const payload = {
      sessionId: state.bill.sessionId || state.sessionId,
      tableId: state.bill.tableId || state.tableId,
      paymentMethod: state.method,
      note: (el.noteInput.value || "").trim()
    };

    try {
      const res = await fetch(`/dinio/api/cashier/bill/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildCsrfHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const out = await res.json();
      toast("Thanh toán thành công.");
      // nếu backend trả invoiceId: out.invoiceId
      // bạn có thể redirect về table map hoặc reload bill
      await fetchBillPreview();
    } catch (e) {
      toast("Thanh toán thất bại.");
      console.error(e);
    }
  }

  function buildCsrfHeaders() {
    const token = document.querySelector('meta[name="_csrf"]')?.getAttribute("content");
    const header = document.querySelector('meta[name="_csrf_header"]')?.getAttribute("content");
    if (token && header) return { [header]: token };
    return {};
  }

  function wirePaymentMethods() {
    el.payMethods.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-method]");
      if (!btn) return;
      $$("#payMethods .cbp-payopt").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.method = btn.getAttribute("data-method") || "CASH";
      el.rMethod.textContent = methodLabel(state.method);
    });
  }

  function wireActions() {
    el.refreshBtn.addEventListener("click", fetchBillPreview);

    el.btnPrint.addEventListener("click", () => {
      if (!state.bill) return;
      window.print();
    });

    el.btnPay.addEventListener("click", finalizePayment);
  }

  function initEmptyReceipt() {
    setButtonsEnabled(false);
    el.billMeta.textContent = "Chưa chọn bàn";
    el.billStatus.textContent = "—";
    el.rMethod.textContent = methodLabel(state.method);
  }

  readQuery();
  initEmptyReceipt();
  wirePaymentMethods();
  wireActions();
  fetchBillPreview();
});
