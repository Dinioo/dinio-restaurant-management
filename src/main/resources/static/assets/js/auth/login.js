document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const pwToggle = document.getElementById("pwToggle");
  const alertBox = document.getElementById("authAlert");
  const submitBtn = document.getElementById("submitBtn");

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

  if (pwToggle) {
    pwToggle.addEventListener("click", () => {
      const isPw = password.type === "password";
      password.type = isPw ? "text" : "password";
      pwToggle.querySelector("i").className = isPw ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  }

  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const provider = btn.dataset.provider || "provider";
      showAlert(`(${provider}) Chưa cấu hình OAuth. Hiện tại nút chỉ để demo UI.`);
      setTimeout(hideAlert, 2600);
    });
  });

  form?.addEventListener("submit", (e) => {
    hideAlert();

    const vEmail = (email.value || "").trim();
    const vPw = password.value || "";

    if (!vEmail || !vPw) {
      e.preventDefault();
      showAlert("Vui lòng nhập đầy đủ Email và Password.");
      return;
    }

    if (!vEmail.includes("@") || vEmail.length < 6) {
      e.preventDefault();
      showAlert("Email chưa đúng định dạng.");
      return;
    }

    if (vPw.length < 6) {
      e.preventDefault();
      showAlert("Password tối thiểu 6 ký tự.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.85";
    submitBtn.querySelector("span").textContent = "Đang đăng nhập...";
  });
});
