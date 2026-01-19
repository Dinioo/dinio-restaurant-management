document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, root = document) => root.querySelector(s);

  const openForgotBtn = $("#openForgot");
  const fpModal = $("#fpModal");
  const fpForm = $("#fpForm");
  const fpEmail = $("#fpEmail");
  const fpAlert = $("#fpAlert");
  const fpSubmitBtn = $("#fpSubmitBtn");

  const getHeaders = () => {
    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const headers = { 'Content-Type': 'application/json' };
    
    if (token && header) {
      headers[header] = token; 
    }
    return headers;
  };

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

  openForgotBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  fpModal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
    if (e.target?.id === "fpClose") closeModal();
    if (e.target?.closest?.("#fpClose")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !fpModal.classList.contains("is-hidden")) closeModal();
  });

  fpForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = (fpEmail?.value || "").trim();
    if (!email) {
      showAlert("Vui lòng nhập email.", true);
      return;
    }

    const originalText = fpSubmitBtn?.textContent || "Khôi phục mật khẩu";
    if (fpSubmitBtn) {
      fpSubmitBtn.disabled = true;
      fpSubmitBtn.style.opacity = "0.85";
      fpSubmitBtn.textContent = "Đang gửi...";
    }

  try {
      const response = await fetch('/dinio/api/forgot-password/send-otp', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email: email })
      });
      const result = await response.text();

      if (response.ok) {
        successToast("Mã OTP đã được gửi thành công!");
        closeModal();
        if (typeof window.openOtpModal === "function") {
            window.openOtpModal(email);
          }
      } else {
          showAlert(result, true); 
      }
  } catch (error) {
      errorToast("Lỗi kết nối server. Vui lòng thử lại sau.");
  }

    if (fpSubmitBtn) {
      fpSubmitBtn.disabled = false;
      fpSubmitBtn.style.opacity = "1";
      fpSubmitBtn.textContent = originalText;
    }
  });
});
