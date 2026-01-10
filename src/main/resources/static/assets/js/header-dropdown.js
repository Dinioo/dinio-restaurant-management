document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.getElementById("userMenu");
  const btn = document.getElementById("userBtn");
  const dd  = document.getElementById("userDropdown");

  if (!wrap || !btn || !dd) return;

  const open = () => {
    dd.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    dd.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dd.classList.contains("is-open") ? close() : open();
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
});
