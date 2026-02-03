document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const submitBtn = document.getElementById("submitBtn");

  const fullName = document.getElementById("fullName");
  const identifier = document.getElementById("identifier");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  const pwToggle1 = document.getElementById("pwToggle1");
  const pwToggle2 = document.getElementById("pwToggle2");

  const getHeaders = () => {
    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const headers = { 'Content-Type': 'application/json' };
    
    if (token && header) {
      headers[header] = token; 
    }
    return headers;
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

  identifier?.addEventListener("input", () => {
    const v = (identifier.value || "").trim();
    if (/^(\+84|0)?\d+$/.test(v)) 
      identifier.setAttribute("inputmode", "tel");
    else 
      identifier.setAttribute("inputmode", "email");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameVal = (fullName.value || "").trim();
    const idVal = (identifier.value || "").trim();
    const pwVal = password.value || "";
    const cpwVal = confirmPassword.value || "";

    if (nameVal.length < 2) 
      return errorToast("Vui lòng nhập họ tên hợp lệ (tối thiểu 2 ký tự).");
    if (!isEmail(idVal) && !isPhone(idVal)) 
      return errorToast("Vui lòng nhập Email hoặc số điện thoại hợp lệ.");
    if (pwVal.length < 6) 
      return errorToast("Mật khẩu tối thiểu 6 ký tự.");
    if (pwVal !== cpwVal) 
      return errorToast("Mật khẩu nhập lại không khớp.");

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Đang xử lý...</span>`;

    try {
      const response = await fetch('/dinio/register', { 
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName: nameVal,
          identifier: idVal,
          password: pwVal,
          confirmPassword: cpwVal
        })
      });

      const message = await response.text();

      if (response.ok) {
        successToast("Đăng ký thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.href = "/dinio/login"; 
        }, 1500);
      } else {
        errorToast(message || "Đăng ký thất bại.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }

    } catch (err) {
      console.error(err);
      errorToast("Lỗi kết nối đến máy chủ.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const provider = btn.dataset.provider || "provider";
      infoToast(`Đăng ký qua ${provider} hiện chưa được hỗ trợ.`);
    });
  });
});