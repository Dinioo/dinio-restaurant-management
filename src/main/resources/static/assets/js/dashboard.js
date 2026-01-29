const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";

const toast = (msg, type = "info") => {
  Toastify({
    text: msg,
    duration: 1800,
    gravity: "top",
    position: "right",
    close: true,
    className: type,
    stopOnFocus: true
  }).showToast();
};

const $ = (id) => document.getElementById(id);

const state = {
  shift: {
    name: "Ca sáng",
    start: "08:00",
    end: "14:00",
    worked: "1h29’",
    bills: 12,
    revenue: 3850000,
    cash: 1500000,
    transfer: 2350000,
    isOpen: true
  },
  counts: {
    patchers: 2,
    payingBills: 1
  },
  stats: {
    seated: 5,
    needOrder: 2,
    paying: 1,
    cancelled: 1
  }
};

const openModal = (id) => {
  const m = $(id);
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";
};

const closeModal = (id) => {
  const m = $(id);
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
};

const blockers = () => {
  const b = [];
  if (state.counts.payingBills > 0) b.push(`Còn ${state.counts.payingBills} bill đang tính tiền`);
  if (state.counts.patchers > 0) b.push(`Còn ${state.counts.patchers} patcher đang lưu`);
  if (state.stats.paying > 0) b.push(`Còn ${state.stats.paying} bàn chờ thanh toán`);
  return b;
};

const render = () => {
  $("shiftName").textContent = state.shift.name;
  $("shiftTime").textContent = `${state.shift.start} — ${state.shift.end}`;
  $("shiftWorked").textContent = state.shift.worked;
  $("shiftBills").textContent = String(state.shift.bills);
  $("shiftRevenue").textContent = fmtVND(state.shift.revenue);
  $("shiftState").textContent = state.shift.isOpen ? "ĐANG MỞ" : "ĐÃ KẾT";

  $("sumBills").textContent = String(state.shift.bills);
  $("sumRevenue").textContent = fmtVND(state.shift.revenue);
  $("sumCash").textContent = fmtVND(state.shift.cash);
  $("sumTransfer").textContent = fmtVND(state.shift.transfer);

  $("patcherCount").textContent = String(state.counts.patchers);
  $("payingCount").textContent = String(state.counts.payingBills);

  $("statSeated").textContent = String(state.stats.seated);
  $("statNeedOrder").textContent = String(state.stats.needOrder);
  $("statPaying").textContent = String(state.stats.paying);
  $("statCancelled").textContent = String(state.stats.cancelled);

  const endShiftHint = $("endShiftHint");
  const btnEndShift = $("btnEndShift");

  if (!state.shift.isOpen) {
    btnEndShift.disabled = true;
    endShiftHint.textContent = "Ca đã kết.";
    return;
  }

  const b = blockers();
  if (b.length === 0) {
    btnEndShift.disabled = false;
    endShiftHint.textContent = "Có thể kết ca.";
  } else {
    btnEndShift.disabled = true;
    endShiftHint.textContent = b[0];
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.getAttribute("data-nav");
      if (nav) window.location.href = nav;
    });
  });

  $("btnPatchers").addEventListener("click", () => {
    if (state.counts.patchers <= 0) {
      toast("Không có patcher nào", "info");
      return;
    }
    window.location.href = "/dinio/waiter/order";
  });

  $("btnPayingBills").addEventListener("click", () => {
    if (state.counts.payingBills <= 0) {
      toast("Không có bill đang tính tiền", "info");
      return;
    }
    window.location.href = "/dinio/waiter/bill/review";
  });

  $("btnRefresh").addEventListener("click", () => {
    toast("Đã làm mới", "info");
    render();
  });

  const modalId = "endShiftModal";
  const blockerBox = $("endShiftBlocker");
  const blockerText = $("endShiftBlockerText");
  const chk = $("chkConfirm");
  const btnConfirm = $("btnConfirmEndShift");

  $("btnEndShift").addEventListener("click", () => {
    chk.checked = false;
    btnConfirm.disabled = true;

    const b = blockers();
    if (b.length === 0) {
      blockerBox.style.display = "none";
      blockerText.textContent = "";
    } else {
      blockerBox.style.display = "grid";
      blockerText.textContent = b.join(" · ");
    }

    openModal(modalId);
  });

  document.querySelectorAll(`#${modalId} [data-close="1"]`).forEach((x) => {
    x.addEventListener("click", () => closeModal(modalId));
  });

  chk.addEventListener("change", () => {
    const b = blockers();
    btnConfirm.disabled = !(chk.checked && b.length === 0 && state.shift.isOpen);
  });

  btnConfirm.addEventListener("click", () => {
    const b = blockers();
    if (b.length > 0) {
      toast("Chưa thể kết ca. Hãy xử lý hết bill/patcher.", "error");
      return;
    }
    if (!chk.checked) {
      toast("Vui lòng xác nhận trước khi kết ca.", "warning");
      return;
    }

    state.shift.isOpen = false;
    toast("Kết ca thành công", "success");
    closeModal(modalId);
    render();
  });

  render();
});
