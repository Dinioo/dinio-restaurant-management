document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("fpOtpModal");
  if (!modal) return;

  const form = document.getElementById("fpOtpForm");
  const inputs = Array.from(modal.querySelectorAll(".otp"));
  const alertBox = document.getElementById("fpOtpAlert");
  const emailPreview = document.getElementById("fpOtpEmailPreview");
  const resendBtn = document.getElementById("fpResendOtpBtn");

  let currentEmail = "";

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

  const openOtpModal = (emailText = "email") => {
    currentEmail = emailText;
    if (emailPreview) emailPreview.textContent = emailText;

    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
    hideAlert();

    inputs.forEach(i => (i.value = ""));
    setTimeout(() => inputs[0]?.focus(), 0);
  };

  const closeOtpModal = () => {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  window.openOtpModal = openOtpModal;
  window.closeOtpModal = closeOtpModal;

  modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeOtpModal();
  });
  modal.querySelectorAll("[data-close='1']").forEach(btn => btn.addEventListener("click", closeOtpModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("is-hidden")) closeOtpModal();
  });
  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      const v = e.target.value.replace(/\D/g, "");
      e.target.value = v.slice(-1);
      if (e.target.value && idx < inputs.length - 1) inputs[idx + 1].focus();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && idx > 0) inputs[idx - 1].focus();
      if (e.key === "ArrowLeft" && idx > 0) inputs[idx - 1].focus();
      if (e.key === "ArrowRight" && idx < inputs.length - 1) inputs[idx + 1].focus();
    });

    input.addEventListener("paste", (e) => {
      const text = (e.clipboardData || window.clipboardData).getData("text");
      const digits = (text || "").replace(/\D/g, "").slice(0, inputs.length);
      if (!digits) return;

      e.preventDefault();
      digits.split("").forEach((d, i) => {
        if (inputs[i]) inputs[i].value = d;
      });
      inputs[Math.min(digits.length, inputs.length) - 1]?.focus();
    });
  });

  const getOtp = () => inputs.map(i => i.value).join("");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const otp = getOtp();
    if (otp.length !== inputs.length) {
      showAlert("Vui lòng nhập đủ 6 số OTP.", true);
      return;
    }

    await new Promise((r) => setTimeout(r, 500));
    if (otp === "123456") {
      showAlert("Xác minh OTP thành công! (mock)", false);

      setTimeout(() => {
        window.closeOtpModal?.();
        window.openResetModal?.(currentEmail);
      }, 350);

    } else {
      showAlert("OTP không đúng (mock). Thử 123456.", true);
    }

  });

  resendBtn?.addEventListener("click", async () => {
    hideAlert();
    await new Promise((r) => setTimeout(r, 400));
    showAlert("Đã gửi lại OTP (mock). Thử nhập 123456.", false);
  });
});
