document.addEventListener("DOMContentLoaded", () => {
  const roleSeg = document.getElementById("roleSeg");
  const form = document.getElementById("staffLoginForm");
  const pwToggle = document.getElementById("pwToggle");
  const pwInput = document.getElementById("password");

  const applyRole = (role) => {
    roleSeg.querySelectorAll(".sl-seg-btn").forEach(btn => {
      const on = btn.dataset.role === role;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    form.setAttribute("action", role === "admin" ? "/admin/login" : "/staff/login");
  };

  roleSeg?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sl-seg-btn");
    if (!btn) return;
    applyRole(btn.dataset.role || "staff");
  });

  pwToggle?.addEventListener("click", () => {
    const isPw = pwInput.type === "password";
    pwInput.type = isPw ? "text" : "password";
    const icon = pwToggle.querySelector("i");
    if (icon) icon.className = isPw ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  applyRole("staff");
});
