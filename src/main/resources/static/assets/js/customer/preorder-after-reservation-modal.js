(() => {
  const modal = document.getElementById("preOrderModal");
  if (!modal) 
    return;

  const alertBox = document.getElementById("preoAlert");
  const yesBtn = document.getElementById("preoYesBtn");
  const noBtn  = document.getElementById("preoNoBtn");

  const hideAlert = () => {
    if (!alertBox) 
      return;
    alertBox.classList.add("is-hidden");
    alertBox.textContent = "";
    alertBox.classList.remove("error");
  };

  const open = () => {
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
    hideAlert();
  };

  const close = () => {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
    hideAlert();
  };

  window.openPreOrderModal = open;
  window.closePreOrderModal = close;

  modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("is-hidden")) close();
  });

yesBtn?.addEventListener("click", () => {
  close();
  const rid = sessionStorage.getItem("dinio_preorder_rid");
  window.location.href = rid ? `/dinio/preorder?rid=${encodeURIComponent(rid)}` : "/dinio/preorder";
});

  noBtn?.addEventListener("click", () => {
    close();
    window.location.href = "/dinio/reservations/my";
  });
})();
