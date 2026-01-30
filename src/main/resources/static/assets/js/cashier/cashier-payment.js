document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const toast = {
    success: (m) =>
      window.successToast ? window.successToast(m) : console.log(m),
    error: (m) => (window.errorToast ? window.errorToast(m) : console.error(m)),
    warning: (m) =>
      window.warningToast ? window.warningToast(m) : console.warn(m),
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

  const fmtMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

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
    state.billUrl = billId
      ? `${window.location.origin}/dinio/cashier/bills?billId=${encodeURIComponent(billId)}`
      : "";
  }

  function renderPayMeta() {
    ui.payMeta.textContent =
      state.payMethod === "CASH"
        ? "Cash"
        : state.payMethod === "BANK"
          ? "Bank"
          : "Visa";
  }

  function renderPayActive() {
    const btns = ui.payGrid
      ? Array.from(ui.payGrid.querySelectorAll(".csp-payopt"))
      : [];
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
    ui.sumDiscount.textContent =
      discount > 0 ? `- ${fmtMoney(discount)}` : fmtMoney(0);
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
    ui.qrHint.textContent = state.billUrl
      ? "Quét để mở hoá đơn"
      : "Chưa có link hoá đơn";
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
    try {
      const response = await fetch(
        `/dinio/api/cashier/payment-detail?tableId=${tableId}`,
      );
      if (!response.ok) throw new Error("API error");

      const data = await response.json();

      // Transform data để khớp với format hiện tại
      return {
        tableId: data.tableId,
        status: data.status,
        areaLabel: data.areaLabel,
        customer: {
          name: data.customer.name,
          phone: data.customer.phone,
          tier: data.customer.tier,
          tierLabel: data.customer.tierLabel,
        },
        items: data.items.map((item) => ({
          name: item.name,
          qty: item.qty,
          lineTotal: Number(item.lineTotal),
        })),
        note: data.note,
        billId: data.billId,
      };
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu thanh toán:", error);
      throw error;
    }
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
      const { total } = calc();
      const payload = {
        tableId: parseInt(state.tableId),
        paymentMethod: state.payMethod,
        amount: total,
      };

      // Nếu chọn BANK (Chuyển khoản) → redirect sang VNPay
      if (state.payMethod === "BANK") {
        toast.info("Đang chuyển đến VNPay...");

        const response = await fetch(
          "/dinio/api/cashier/create-vnpay-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) throw new Error("Không thể tạo link VNPay");

        const result = await response.json();

        if (result.paymentUrl) {
          // Redirect sang VNPay
          window.location.href = result.paymentUrl;
        } else {
          throw new Error("Không nhận được payment URL");
        }
        return;
      }

      // CASH hoặc VISA → thanh toán trực tiếp
      toast.info("Đang xử lý thanh toán...");

      const response = await fetch("/dinio/api/cashier/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Payment failed");

      const result = await response.json();

      toast.success("Thanh toán thành công!");
      closeModal(ui.payModal);

      // Chờ 1s rồi quay về trang tables
      setTimeout(() => {
        window.location.href = "/dinio/cashier/tables";
      }, 1000);
    } catch (e) {
      toast.error("Thanh toán thất bại: " + e.message);
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

// Lấy tableId từ URL
const urlParams = new URLSearchParams(window.location.search);
const tableId = urlParams.get("tableId");

// Tải chi tiết thanh toán
async function loadPaymentDetail() {
  try {
    const response = await fetch(
      `/dinio/api/cashier/payment-detail?tableId=${tableId}`,
    );
    const data = await response.json();

    // Hiển thị thông tin
    document.getElementById("tableName").textContent = data.tableName;
    document.getElementById("custName").textContent = data.customer.name;
    document.getElementById("custPhone").textContent = data.customer.phone;

    // Render items
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = data.items
      .map(
        (item, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.lineTotal.toLocaleString()}đ</td>
            </tr>
        `,
      )
      .join("");

    // Hiển thị tổng tiền
    document.getElementById("sumTotal").textContent =
      data.total.toLocaleString() + "đ";
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
  }
}

// Xử lý thanh toán
async function handlePayment() {
  const paymentMethod = document.querySelector(".csp-payopt.is-active").dataset
    .pay;
  const amount = parseFloat(
    document.getElementById("sumTotal").textContent.replace(/\D/g, ""),
  );

  try {
    const response = await fetch("/api/cashier/process-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: parseInt(tableId),
        paymentMethod: paymentMethod,
        amount: amount,
      }),
    });

    const result = await response.json();
    alert("Thanh toán thành công!");
    window.location.href = "/cashier/tables";
  } catch (error) {
    alert("Thanh toán thất bại: " + error.message);
  }
}

loadPaymentDetail();
