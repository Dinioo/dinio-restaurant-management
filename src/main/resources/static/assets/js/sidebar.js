document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("appSidebar");
  const toggle = document.getElementById("menuToggle");
  const toggleFab = document.getElementById("menuToggleFloating");
  const backdrop = document.getElementById("sideBackdrop");

  if (!sidebar) 
    return;

  const isMobile = () => window.innerWidth <= 1024;

  const openMobile = () => {
    sidebar.classList.add("is-open");
    if (backdrop) 
      backdrop.classList.add("is-show");
    document.body.classList.add("side-open");
  };

  const closeMobile = () => {
    sidebar.classList.remove("is-open");
    if (backdrop) 
      backdrop.classList.remove("is-show");
    document.body.classList.remove("side-open");
  };

  const toggleMobile = () => {
    if (sidebar.classList.contains("is-open")) 
      closeMobile();
    else openMobile();
  };

  const toggleDesktop = () => {
    sidebar.classList.toggle("is-collapsed");
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (isMobile()) 
        toggleMobile();
      else toggleDesktop();
    });
  }

  if (toggleFab) {
    toggleFab.addEventListener("click", () => {
      if (isMobile()) 
        openMobile();
      else toggleDesktop();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", () => {
      if (isMobile()) 
        closeMobile();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobile()) 
      closeMobile();
  });

  sidebar.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) 
      return;
    if (isMobile()) 
      closeMobile();
  });

  let lastMobile = isMobile();
  window.addEventListener("resize", () => {
    const nowMobile = isMobile();
    if (nowMobile === lastMobile) 
      return;

    sidebar.classList.remove("is-open");
    sidebar.classList.remove("is-collapsed");
    if (backdrop) 
      backdrop.classList.remove("is-show");
    document.body.classList.remove("side-open");

    lastMobile = nowMobile;
  });
});
