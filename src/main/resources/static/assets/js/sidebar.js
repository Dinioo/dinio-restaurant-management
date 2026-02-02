document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("appSidebar");

  // nút có sẵn trong sidebar
  const toggle = document.getElementById("menuToggle");

  // nút floating (nếu bạn có thêm)
  const toggleFab = document.getElementById("menuToggleFloating");

  // backdrop (nếu bạn có thêm)
  const backdrop = document.getElementById("sideBackdrop");

  if (!sidebar) return;

  const isMobile = () => window.innerWidth <= 1024;

  const openMobile = () => {
    sidebar.classList.add("is-open");
    if (backdrop) backdrop.classList.add("is-show");
    // optional: khoá scroll nền
    document.body.classList.add("side-open");
  };

  const closeMobile = () => {
    sidebar.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-show");
    document.body.classList.remove("side-open");
  };

  const toggleMobile = () => {
    if (sidebar.classList.contains("is-open")) closeMobile();
    else openMobile();
  };

  const toggleDesktop = () => {
    sidebar.classList.toggle("is-collapsed");
  };

  // Click nút trong sidebar
  if (toggle) {
    toggle.addEventListener("click", () => {
      if (isMobile()) toggleMobile();
      else toggleDesktop();
    });
  }

  // Click nút floating (nếu có)
  if (toggleFab) {
    toggleFab.addEventListener("click", () => {
      // trên desktop thì cũng collapse cho đồng nhất
      if (isMobile()) openMobile();
      else toggleDesktop();
    });
  }

  // Click backdrop để đóng (mobile)
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      if (isMobile()) closeMobile();
    });
  }

  // ESC để đóng (mobile)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobile()) closeMobile();
  });

  // (Optional) Click link trong sidebar => tự đóng trên mobile
  sidebar.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (isMobile()) closeMobile();
  });

  // Khi resize đổi mode, reset class để khỏi bị kẹt trạng thái
  let lastMobile = isMobile();
  window.addEventListener("resize", () => {
    const nowMobile = isMobile();
    if (nowMobile === lastMobile) return;

    // chuyển mode => clear state mobile + desktop cho sạch
    sidebar.classList.remove("is-open");
    sidebar.classList.remove("is-collapsed");
    if (backdrop) backdrop.classList.remove("is-show");
    document.body.classList.remove("side-open");

    lastMobile = nowMobile;
  });
});
