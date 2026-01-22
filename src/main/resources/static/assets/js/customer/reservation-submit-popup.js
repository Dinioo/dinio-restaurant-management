document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reserveForm");
  const btn  = document.getElementById("btnSubmitReserve");
  if (!form || !btn) 
    return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();

    if (typeof window.openPreOrderModal === "function") {
      window.openPreOrderModal();
    } else {
      alert("Chưa load preorder-after-reservation-modal.js hoặc thiếu modal #preOrderModal");
    }
  });
});
