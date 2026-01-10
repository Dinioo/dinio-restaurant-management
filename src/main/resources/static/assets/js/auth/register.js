document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const alertBox = document.getElementById("authAlert");
  const submitBtn = document.getElementById("submitBtn");

  const fullName = document.getElementById("fullName");
  const identifier = document.getElementById("identifier");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  const pwToggle1 = document.getElementById("pwToggle1");
  const pwToggle2 = document.getElementById("pwToggle2");

  const showAlert = (msg) => {
    alertBox.textContent = msg;
    alertBox.classList.remove("is-hidden");
    alertBox.classList.add("error");
  };

  const hideAlert = () => {
    alertBox.classList.add("is-hidden");
    alertBox.classList.remove("error");
    alertBox.textContent = "";
  };

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^(0|\+84)\d{8,10}$/.test(v);

  const togglePw = (input, btn) => {
    const isPw = input.type === "password";
    input.type = isPw ? "text" : "password";
    const icon = btn.querySelector("i");
    icon.className = isPw ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  };

  pwToggle1?.addEventListener("click", () => togglePw(password, pwToggle1));
  pwToggle2?.addEventListener("click", () => togglePw(confirmPassword, pwToggle2));

  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const provider = btn.dataset.provider || "provider";
      showAlert(`(${provider}) Chưa cấu hình đăng ký OAuth. Nút hiện tại chỉ để demo UI.`);
      setTimeout(hideAlert, 2600);
    });
  });

  identifier?.addEventListener("input", () => {
    const v = (identifier.value || "").trim();
    if (/^(\+84|0)?\d+$/.test(v)) identifier.setAttribute("inputmode", "tel");
    else identifier.setAttribute("inputmode", "email");
  });

  form?.addEventListener("submit", (e) => {
    hideAlert();

    const nameVal = (fullName.value || "").trim();
    const idVal = (identifier.value || "").trim();
    const pwVal = password.value || "";
    const cpwVal = confirmPassword.value || "";

    if (nameVal.length < 2) {
      e.preventDefault();
      showAlert("Vui lòng nhập họ tên hợp lệ (tối thiểu 2 ký tự).");
      return;
    }

    if (!isEmail(idVal) && !isPhone(idVal)) {
      e.preventDefault();
      showAlert("Vui lòng nhập Email hoặc số điện thoại hợp lệ.");
      return;
    }

    if (pwVal.length < 6) {
      e.preventDefault();
      showAlert("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    if (pwVal !== cpwVal) {
      e.preventDefault();
      showAlert("Mật khẩu nhập lại không khớp.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.85";
    submitBtn.querySelector("span").textContent = "Đang tạo tài khoản...";
  });
});
