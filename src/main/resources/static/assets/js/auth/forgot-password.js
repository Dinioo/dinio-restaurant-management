(() => {
  const $ = (s) => document.querySelector(s);

  const openForgot = $("#openForgot");
  const fpModal = $("#fpModal");
  const fpClose = $("#fpClose");
  const fpForm = $("#fpForm");
  const fpEmail = $("#fpEmail");
  const fpAlert = $("#fpAlert");
  const fpSubmitBtn = $("#fpSubmitBtn");

  if (!openForgot || !fpModal) return;

  function openModal(){
    fpModal.classList.remove("is-hidden");
    fpModal.setAttribute("aria-hidden", "false");
    fpAlert?.classList.add("is-hidden");
    if (fpAlert) fpAlert.textContent = "";
    setTimeout(() => fpEmail?.focus(), 0);
  }

  function closeModal(){
    fpModal.classList.add("is-hidden");
    fpModal.setAttribute("aria-hidden", "true");
  }

  openForgot.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  fpClose?.addEventListener("click", closeModal);

  fpModal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !fpModal.classList.contains("is-hidden")) closeModal();
  });

  fpForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (fpEmail?.value || "").trim();
    if (!email) return;

    fpSubmitBtn.disabled = true;

    try{
      const res = await fetch("/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) throw new Error("Request failed");

      fpAlert.classList.remove("is-hidden");
      fpAlert.classList.remove("error");
      fpAlert.textContent = "Đã gửi link đặt lại. Vui lòng kiểm tra email.";
    }catch(err){
      fpAlert.classList.remove("is-hidden");
      fpAlert.classList.add("error");
      fpAlert.textContent = "Không gửi được. Thử lại sau.";
    }finally{
      fpSubmitBtn.disabled = false;
    }
  });
})();
