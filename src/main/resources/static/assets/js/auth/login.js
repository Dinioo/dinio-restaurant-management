document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const identifierInput = document.getElementById("identifier");
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

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const vIdentifier = (identifierInput.value || "").trim();
    const vPw = password.value || "";

    if (!vIdentifier || !vPw) {
      e.preventDefault();
      showAlert("Vui lòng nhập đầy đủ Email và Password.");
      return;
    }

    if (vPw.length < 6) {
      e.preventDefault();
      showAlert("Password tối thiểu 6 ký tự.");
      return;
    }

    const originalBtnText = submitBtn.querySelector("span").textContent;

    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.85";
    submitBtn.querySelector("span").textContent = "Đang xử lý...";

    try {
      const formData = new FormData();
      formData.append("identifier", vIdentifier);
      formData.append("password", vPw);

      const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
      const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

      const headers = {};
      if (csrfToken && csrfHeader) {
        headers[csrfHeader] = csrfToken;
      }

      const actionUrl = form.getAttribute("action");

      const response = await fetch(actionUrl, {
        method: "POST",
        headers: headers,
        body: formData,
        credentials: "same-origin"
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirectUrl || "/";
      } else {
        const errorText = await response.text();
        try {
          const errJson = JSON.parse(errorText);
          showAlert(errJson.message || "Đăng nhập thất bại.");
        } catch {
          console.error("Server returned HTML instead of JSON:", errorText);
          showAlert("Tài khoản hoặc mật khẩu không đúng.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      errorToast("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    }
    finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.querySelector("span").textContent = originalBtnText;
    }

  });
});
