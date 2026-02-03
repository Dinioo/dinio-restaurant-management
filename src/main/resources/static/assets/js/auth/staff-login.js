document.addEventListener("DOMContentLoaded", () => {
  const roleSeg = document.getElementById("roleSeg");
  const form = document.getElementById("staffLoginForm");
  const pwToggle = document.getElementById("pwToggle");
  const pwInput = document.getElementById("password");
  const identifierInput = document.getElementById("identifier");
  const submitBtn = document.getElementById("submitBtn");

  const applyRole = (role) => {
    roleSeg.querySelectorAll(".sl-seg-btn").forEach(btn => {
      const on = btn.dataset.role === role;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    form.setAttribute("action", "/dinio/login");
  };

  pwToggle?.addEventListener("click", () => {
    const isPw = pwInput.type === "password";
    pwInput.type = isPw ? "text" : "password";
    const icon = pwToggle.querySelector("i");
    if (icon) 
      icon.className = isPw ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  roleSeg?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sl-seg-btn");
    if (!btn) 
      return;
    applyRole(btn.dataset.role || "staff");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const vIdentifier = (identifierInput.value || "").trim();
    const vPw = pwInput.value || "";

    if (!vIdentifier || !vPw) {
      errorToast("Vui lòng nhập đầy đủ Tài khoản và Mật khẩu.");
      return;
    }

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>Đang xác thực...</span>";

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

      const response = await fetch(form.getAttribute("action"), {
        method: "POST",
        headers: headers,
        body: formData,
        credentials: "same-origin"
      });

      if (response.ok) {
        const data = await response.json();
        successToast("Đăng nhập thành công!");

        setTimeout(() => {
          window.location.href = data.redirectUrl || "/dinio/admin/dashboard";
        }, 1000);
      } else {
        const errorText = await response.text();
        try {
          const errJson = JSON.parse(errorText);
          errorToast(errJson.message || "Đăng nhập thất bại.");
        } catch {
          errorToast("Tài khoản hoặc mật khẩu không chính xác.");
        }
      }
    } catch (error) {
      console.error("Staff Login Error:", error);
      errorToast("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

  applyRole("staff");
});