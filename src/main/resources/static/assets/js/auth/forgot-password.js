document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, root = document) => root.querySelector(s);

  const openForgotBtn = $("#openForgot");
  const fpModal = $("#fpModal");
  const fpForm = $("#fpForm");
  const fpEmail = $("#fpEmail");
  const fpAlert = $("#fpAlert");
  const fpSubmitBtn = $("#fpSubmitBtn");

  if (!openForgotBtn || !fpModal) return;

  const showAlert = (msg, isError = true) => {
    if (!fpAlert) return;
    fpAlert.textContent = msg;
    fpAlert.classList.remove("is-hidden");
    fpAlert.classList.toggle("error", isError);
  };

  const hideAlert = () => {
    if (!fpAlert) return;
    fpAlert.textContent = "";
    fpAlert.classList.add("is-hidden");
    fpAlert.classList.remove("error");
  };

  const openModal = () => {
    fpModal.classList.remove("is-hidden");
    fpModal.setAttribute("aria-hidden", "false");
    hideAlert();
    setTimeout(() => fpEmail?.focus(), 0);
  };

  const closeModal = () => {
    fpModal.classList.add("is-hidden");
    fpModal.setAttribute("aria-hidden", "true");
  };

  // Open
  openForgotBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  // Close: backdrop + nút X
  fpModal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
    if (e.target?.id === "fpClose") closeModal();
    if (e.target?.closest?.("#fpClose")) closeModal();
  });

  // Close: ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !fpModal.classList.contains("is-hidden")) closeModal();
  });

  // Submit email: MOCK gửi OTP thành công -> mở OTP modal
  fpForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = (fpEmail?.value || "").trim();
    if (!email) {
      showAlert("Vui lòng nhập email.", true);
      return;
    }

    // UI loading giả
    const originalText = fpSubmitBtn?.textContent || "Khôi phục mật khẩu";
    if (fpSubmitBtn) {
      fpSubmitBtn.disabled = true;
      fpSubmitBtn.style.opacity = "0.85";
      fpSubmitBtn.textContent = "Đang gửi...";
    }

    // ✅ MOCK delay 600ms cho giống gửi thật
    await new Promise((r) => setTimeout(r, 600));

    // giả lập “gửi OTP OK”
    closeModal();

    // otp.js sẽ expose hàm này
    if (typeof window.openOtpModal === "function") {
      window.openOtpModal(email);
    } else {
      alert("Chưa load otp.js hoặc thiếu #fpOtpModal");
    }

    if (fpSubmitBtn) {
      fpSubmitBtn.disabled = false;
      fpSubmitBtn.style.opacity = "1";
      fpSubmitBtn.textContent = originalText;
    }
  });
});
