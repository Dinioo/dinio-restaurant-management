document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("fpResetModal");
  if (!modal) return;

  const emailPreview = document.getElementById("fpResetEmailPreview");
  const alertBox = document.getElementById("fpResetAlert");

  const form = document.getElementById("fpResetForm");
  const newPw = document.getElementById("fpNewPassword");
  const confirmPw = document.getElementById("fpConfirmPassword");
  const submitBtn = document.getElementById("fpResetSubmitBtn");

  const toggle1 = document.getElementById("fpNewPwToggle");
  const toggle2 = document.getElementById("fpConfirmPwToggle");

  let currentEmail = "";
  let currentOtp = "";

  const showAlert = (msg, isError = true) => {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.classList.remove("is-hidden");
    alertBox.classList.toggle("error", isError);
  };

  const hideAlert = () => {
    if (!alertBox) return;
    alertBox.textContent = "";
    alertBox.classList.add("is-hidden");
    alertBox.classList.remove("error");
  };

  const openResetModal = (email, otp) => {
    currentEmail = email || "";
    currentOtp = otp || "";
    if (emailPreview) emailPreview.textContent = email || "email";

    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");

    hideAlert();
    if (newPw) newPw.value = "";
    if (confirmPw) confirmPw.value = "";
    setTimeout(() => newPw?.focus(), 0);
  };

  const closeResetModal = () => {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  window.openResetModal = openResetModal;
  window.closeResetModal = closeResetModal;

  modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeResetModal();
  });

  modal.querySelectorAll("[data-close='1']").forEach(btn => {
    btn.addEventListener("click", closeResetModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("is-hidden")) closeResetModal();
  });

  const bindToggle = (btn, input) => {
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      const icon = btn.querySelector("i");
      if (icon) icon.className = isPw ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  };
  bindToggle(toggle1, newPw);
  bindToggle(toggle2, confirmPw);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const p1 = (newPw?.value || "").trim();
    const p2 = (confirmPw?.value || "").trim();

    if (p1.length < 6) {
      showAlert("Mật khẩu tối thiểu 6 ký tự.", true);
      return;
    }
    if (p1 !== p2) {
      showAlert("Mật khẩu nhập lại không khớp.", true);
      return;
    }

    const original = submitBtn?.textContent || "Đổi mật khẩu";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.85";
      submitBtn.textContent = "Đang xử lý...";
    }

    try {
      const response = await fetch('/dinio/api/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentEmail,
          otp: currentOtp,
          newPassword: p1
        })
      });
      const result = await response.text();

      if (response.ok) {
        successToast("Đổi mật khẩu thành công");

        setTimeout(() => {
          closeResetModal();
          window.location.href = "/login";
        }, 1500);
      } else {
        errorToast(result || "Đổi mật khẩu thất bại");
      }

    } catch (error) {
      showAlert("Lỗi hệ thống.", true);
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.textContent = original;
    }
  });
});
