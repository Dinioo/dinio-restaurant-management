document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("crModal");
  if (!modal) return;

  const yesBtn = document.getElementById("crYesBtn");
  const noBtn  = document.getElementById("crNoBtn");

  const RESERVED_OK_URL = "/dinio/preorder";
  const RESERVATION_URL = "/dinio/reservation/tables"; 

  const open = () => {
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => yesBtn?.focus(), 0);
  };

  const close = () => {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  // expose để gọi từ bất kỳ nút nào
  window.openCheckReservationModal = open;
  window.closeCheckReservationModal = close;

  // close handlers
  modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("is-hidden")) close();
  });

  yesBtn?.addEventListener("click", () => {
    close();
    window.location.href = RESERVED_OK_URL;
  });

  noBtn?.addEventListener("click", () => {
    close();
    window.location.href = RESERVATION_URL;
  });

  document.querySelectorAll('[data-action="order"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });

});
