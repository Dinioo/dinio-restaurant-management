const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";

const toast = (msg, type = "info") => {
  if (typeof Toastify !== 'undefined') {
    Toastify({
      text: msg, duration: 1800, gravity: "top", position: "right",
      close: true, className: type, stopOnFocus: true
    }).showToast();
  } else {
    console.log(`${type}: ${msg}`);
  }
};

const $ = (id) => document.getElementById(id);

let state = {
  shift: {
    name: "Ca hiện tại",
    start: "09:00",
    end: "22:00",
    worked: "0h00’",
    bills: 0,
    revenue: "0đ",
    cash: "0đ",
    transfer: "0đ",
    isOpen: true
  },
  counts: { patchers: 0, payingBills: 0 },
  stats: { seated: 0, needOrder: 0, paying: 0, cancelled: 0 }
};

const fetchDashboardData = async () => {
  try {
    const response = await fetch('/dinio/api/dashboard/stats');
    if (!response.ok) 
      throw new Error("Lỗi fetch");

    const data = await response.json();

    state.shift.worked = data.shiftWorked || "0h00’";
    state.shift.bills = data.shiftBills || 0;
    state.shift.revenue = data.shiftRevenue || "0đ";

    state.shift.cash = data.shiftCash || "0đ";
    state.shift.transfer = data.shiftTransfer || "0đ";

    state.stats = {
      seated: data.statSeated || 0,
      needOrder: data.statNeedOrder || 0,
      paying: data.statPaying || 0,
      cancelled: data.statCancelled || 0
    };

    state.counts.payingBills = data.statPaying || 0;

    render();
  } catch (err) {
    console.error("API Error:", err);
    render();
  }
};

const openModal = (id) => {
  const m = $(id);
  if (m) {
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }
};

const closeModal = (id) => {
  const m = $(id);
  if (m) {
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }
};

const blockers = () => {
  const b = [];
  if (state.counts.payingBills > 0) 
    b.push(`Còn ${state.counts.payingBills} bill đang tính tiền`);
  if (state.stats.paying > 0) 
    b.push(`Còn ${state.stats.paying} bàn chờ thanh toán`);
  return b;
};

const render = () => {
  if ($("shiftName")) 
    $("shiftName").textContent = state.shift.name;
  if ($("shiftTime")) 
    $("shiftTime").textContent = `${state.shift.start} — ${state.shift.end}`;
  if ($("shiftWorked")) 
    $("shiftWorked").textContent = state.shift.worked;
  if ($("shiftBills")) 
    $("shiftBills").textContent = String(state.shift.bills);
  if ($("shiftRevenue")) 
    $("shiftRevenue").textContent = state.shift.revenue;
  if ($("shiftState")) 
    $("shiftState").textContent = state.shift.isOpen ? "ĐANG MỞ" : "ĐÃ KẾT";

  if ($("sumBills")) 
    $("sumBills").textContent = String(state.shift.bills);
  if ($("sumRevenue")) 
    $("sumRevenue").textContent = state.shift.revenue;
  if ($("sumCash")) 
    $("sumCash").textContent = state.shift.cash;
  if ($("sumTransfer")) 
    $("sumTransfer").textContent = state.shift.transfer;

  if ($("statSeated")) 
    $("statSeated").textContent = String(state.stats.seated);
  if ($("statNeedOrder")) 
    $("statNeedOrder").textContent = String(state.stats.needOrder);
  if ($("statPaying")) 
    $("statPaying").textContent = String(state.stats.paying);
  if ($("statCancelled")) 
    $("statCancelled").textContent = String(state.stats.cancelled);

  const btnEndShift = $("btnEndShift");
  const endShiftHint = $("endShiftHint");
  if (btnEndShift && endShiftHint) {
    if (!state.shift.isOpen) {
      btnEndShift.disabled = true;
      endShiftHint.textContent = "Ca đã kết.";
    } else {
      const b = blockers();
      btnEndShift.disabled = b.length > 0;
      endShiftHint.textContent = b.length === 0 ? "Có thể kết ca." : b[0];
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  fetchDashboardData();

  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      const nav = btn.getAttribute("data-nav");
      if (nav) 
        window.location.href = nav;
    });
  });

  $("btnRefresh")?.addEventListener("click", () => {
    toast("Đang cập nhật...", "info");
    fetchDashboardData();
  });

  const modalId = "endShiftModal";
  $("btnEndShift")?.addEventListener("click", () => {
    const chk = $("chkConfirm");
    const btnConfirm = $("btnConfirmEndShift");
    if (chk) 
      chk.checked = false;
    if (btnConfirm) 
      btnConfirm.disabled = true;

    const b = blockers();
    const box = $("endShiftBlocker");
    const txt = $("endShiftBlockerText");
    if (box && txt) {
      box.style.display = b.length === 0 ? "none" : "grid";
      txt.textContent = b.join(" · ");
    }
    openModal(modalId);
  });

  document.querySelectorAll(`#${modalId} [data-close="1"]`).forEach(x => {
    x.addEventListener("click", () => closeModal(modalId));
  });

  $("chkConfirm")?.addEventListener("change", (e) => {
    const btnConfirm = $("btnConfirmEndShift");
    if (btnConfirm) 
      btnConfirm.disabled = !e.target.checked || blockers().length > 0;
  });
});