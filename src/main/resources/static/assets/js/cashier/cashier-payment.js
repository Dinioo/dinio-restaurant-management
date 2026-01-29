document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const toast = {
    success: (m) => (window.successToast ? window.successToast(m) : console.log(m)),
    error: (m) => (window.errorToast ? window.errorToast(m) : console.error(m)),
    warning: (m) => (window.warningToast ? window.warningToast(m) : console.warn(m)),
    info: (m) => (window.infoToast ? window.infoToast(m) : console.log(m)),
  };

  const ui = {
    pillStatus: el("pillStatus"),
    btnBack: el("btnBack"),

    payGrid: el("payGrid"),
    payMeta: el("payMeta"),

    tableName: el("tableName"),
    tableArea: el("tableArea"),
    custTier: el("custTier"),
    custName: el("custName"),
    custPhone: el("custPhone"),

    itemCount: el("itemCount"),
    tbody: el("tbody"),
    billNote: el("billNote"),

    btnEditVat: el("btnEditVat"),
    sumSub: el("sumSub"),
    sumDiscount: el("sumDiscount"),
    sumVat: el("sumVat"),
    sumTotal: el("sumTotal"),
    bottomTotal: el("bottomTotal"),

    qrBox: el("qrBox"),
    qrHint: el("qrHint"),
    btnCopyQr: el("btnCopyQr"),

    btnPay: el("btnPay"),
    btnPrintTmp: el("btnPrintTmp"),

    payModal: el("payModal"),
    mTable: el("mTable"),
    mTotal: el("mTotal"),
    payConfirm: el("payConfirm"),
  };

  const state = {
    tableId: "T01",
    payMethod: "CASH",
    vatRate: 0.08,
    discountRate: 0,
    billUrl: "",
    data: null,
  };

  const fmtMoney = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";

  const parseQuery = () => {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("tableId") || sp.get("table") || "T01";
  };

  const openModal = (node) => {
    if (!node) return;
    node.classList.remove("is-hidden");
    node.setAttribute("aria-hidden", "false");
  };

  const closeModal = (node) => {
    if (!node) return;
    node.classList.add("is-hidden");
    node.setAttribute("aria-hidden", "true");
  };

  const bindModalClose = (node) => {
    if (!node) return;

    node.addEventListener("click", (e) => {
      if (e.target.closest("[data-close='1']")) closeModal(node);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal(node);
    });
  };

  function tierToDiscount(tier) {
    const t = String(tier || "").toUpperCase();
    if (t === "VIP") return 0.1;
    return 0;
  }

  function calc() {
    const items = state.data?.items || [];
    const subtotal = items.reduce((s, it) => s + Number(it.lineTotal || 0), 0);
    const discount = Math.round(subtotal * (state.discountRate || 0));
    const afterDiscount = Math.max(0, subtotal - discount);
    const vat = Math.round(afterDiscount * (state.vatRate || 0));
    const total = afterDiscount + vat;
    return { subtotal, discount, vat, total };
  }

  function updateBillUrl() {
    const billId = state.data?.billId || "";
    state.billUrl = billId ? `${window.location.origin}/dinio/cashier/bills?billId=${encodeURIComponent(billId)}` : "";
  }

  function renderPayMeta() {
    ui.payMeta.textContent = state.payMethod === "CASH" ? "Cash" : state.payMethod === "BANK" ? "Bank" : "Visa";
  }

  function renderPayActive() {
    const btns = ui.payGrid ? Array.from(ui.payGrid.querySelectorAll(".csp-payopt")) : [];
    btns.forEach((b) => {
      const isOn = (b.dataset.pay || "") === state.payMethod;
      b.classList.toggle("is-active", isOn);
      b.setAttribute("aria-checked", isOn ? "true" : "false");
    });
    renderPayMeta();
  }

  function renderItems() {
    const items = state.data?.items || [];
    ui.itemCount.textContent = `${items.length} món`;

    ui.tbody.innerHTML = items
      .map((it, idx) => {
        const stt = idx + 1;
        const name = it.name || "—";
        const qty = Number(it.qty || 0);
        const line = Number(it.lineTotal || 0);

        return `
          <tr>
            <td class="ta-c"><strong>${stt}</strong></td>
            <td>${name}</td>
            <td class="ta-c"><strong>${qty}</strong></td>
            <td class="ta-c"><strong>${fmtMoney(line)}</strong></td>
          </tr>
        `;
      })
      .join("");
  }

  function renderTotals() {
    const { subtotal, discount, vat, total } = calc();
    ui.sumSub.textContent = fmtMoney(subtotal);
    ui.sumDiscount.textContent = discount > 0 ? `- ${fmtMoney(discount)}` : fmtMoney(0);
    ui.sumVat.textContent = `${Math.round((state.vatRate || 0) * 100)}% • ${fmtMoney(vat)}`;
    ui.sumTotal.textContent = fmtMoney(total);
    ui.bottomTotal.textContent = fmtMoney(total);
  }

  function renderMeta() {
    ui.pillStatus.textContent = state.data?.status || "—";

    ui.tableName.textContent = state.data?.tableId || "—";
    ui.tableArea.textContent = state.data?.areaLabel || "—";

    const c = state.data?.customer || {};
    ui.custName.textContent = c.name || "Khách lẻ";
    ui.custPhone.textContent = c.phone || "—";
    ui.custTier.textContent = c.tierLabel || "Khách thường";

    ui.billNote.textContent = state.data?.note || "—";

    ui.qrBox.textContent = "QR";
    ui.qrHint.textContent = state.billUrl ? "Quét để mở hoá đơn" : "Chưa có link hoá đơn";
  }

  function renderAll() {
    if (!state.data) return;
    updateBillUrl();
    renderPayActive();
    renderMeta();
    renderItems();
    renderTotals();
  }

  async function fetchPaymentData(tableId) {
    return {
      tableId,
      status: "Đang phục vụ",
      areaLabel: "Tầng 1",
      customer: { name: "Chị Vy", phone: "0912 888 999", tier: "VIP", tierLabel: "VIP" },
      items: [
        { name: "Bò Wagyu áp chảo • sốt rượu vang đỏ", qty: 1, lineTotal: 890000 },
        { name: "Sò điệp Hokkaido • bơ chanh vàng", qty: 2, lineTotal: 520000 },
        { name: "Cá tuyết nướng miso • măng tây", qty: 1, lineTotal: 460000 },
        { name: "Súp nấm truffle • kem tươi", qty: 2, lineTotal: 320000 },
        { name: "Tráng miệng tiramisu • cacao nguyên chất", qty: 1, lineTotal: 145000 },
      ],
      note: "Ưu tiên bàn yên tĩnh, phục vụ tráng miệng sau món chính.",
      billId: "B100012",
    };
  }

  function validateBeforePay() {
    const { total } = calc();
    if (!["CASH", "BANK", "VISA"].includes(state.payMethod)) {
      toast.warning("Hình thức thanh toán không hợp lệ");
      return false;
    }
    if (total <= 0) {
      toast.error("Tổng tiền không hợp lệ");
      return false;
    }
    return true;
  }

  async function submitPayment() {
    if (!validateBeforePay()) return;

    try {
      toast.info("Đang xử lý thanh toán...");
      await new Promise((r) => setTimeout(r, 350));
      toast.success("Thanh toán thành công");
      closeModal(ui.payModal);
    } catch (e) {
      toast.error("Thanh toán thất bại");
      console.error(e);
    }
  }

  function bind() {
    bindModalClose(ui.payModal);

    ui.btnBack?.addEventListener("click", () => history.back());

    ui.payGrid?.addEventListener("click", (e) => {
      const btn = e.target.closest(".csp-payopt");
      if (!btn) return;
      const v = btn.dataset.pay;
      if (!v) return;

      state.payMethod = v;
      renderPayActive();
    });

    ui.btnEditVat?.addEventListener("click", () => {
      const cur = Math.round((state.vatRate || 0) * 100);
      const v = prompt("Nhập VAT (%)", String(cur));
      if (v === null) return;

      const n = Number(v);
      if (Number.isNaN(n) || n < 0 || n > 30) {
        toast.warning("VAT không hợp lệ");
        return;
      }

      state.vatRate = n / 100;
      toast.success(`Đã cập nhật VAT ${n}%`);
      renderTotals();
    });

    ui.btnCopyQr?.addEventListener("click", async () => {
      if (!state.billUrl) {
        toast.warning("Chưa có link hoá đơn");
        return;
      }
      try {
        await navigator.clipboard.writeText(state.billUrl);
        toast.success("Đã copy link hoá đơn");
      } catch (e) {
        toast.error("Copy thất bại");
        console.error(e);
      }
    });

    ui.btnPrintTmp?.addEventListener("click", () => {
      toast.info("In tạm tính");
      window.print();
    });

    ui.btnPay?.addEventListener("click", () => {
      if (!validateBeforePay()) return;
      const { total } = calc();
      ui.mTable.textContent = state.data?.tableId || state.tableId || "—";
      ui.mTotal.textContent = fmtMoney(total);
      openModal(ui.payModal);
    });

    ui.payConfirm?.addEventListener("click", submitPayment);
  }

  async function init() {
    state.tableId = parseQuery();

    try {
      state.data = await fetchPaymentData(state.tableId);
      state.discountRate = tierToDiscount(state.data?.customer?.tier);
      renderAll();
      toast.info("Đã tải dữ liệu thanh toán");
    } catch (e) {
      toast.error("Không tải được dữ liệu");
      console.error(e);
    }
  }

  bind();
  init();
});
