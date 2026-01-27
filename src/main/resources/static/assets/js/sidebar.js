document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("appSidebar");
  const toggle = document.getElementById("menuToggle");

  if (!sidebar || !toggle) return;

  toggle.addEventListener("click", () => {
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle("is-open");
    } else {
      sidebar.classList.toggle("is-collapsed");
    }
  });
});
