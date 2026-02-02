document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  // ✅ OLD CODE (GIỮ NGUYÊN - KHÔNG ĐỔI)
  // =========================================================
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

  // =========================================================
  // ✅ NEW: NOTIFY POPUP (không đụng code cũ)
  // =========================================================
  const notifyBtn = document.getElementById("notifyBtn");
  const notifyPop = document.getElementById("notifyPop");
  const notifyClose = document.getElementById("notifyClose");

  const openNotify = () => {
    if (!notifyPop || !notifyBtn) return;
    notifyPop.classList.add("is-open");
    notifyBtn.setAttribute("aria-expanded", "true");
  };

  const closeNotify = () => {
    if (!notifyPop || !notifyBtn) return;
    notifyPop.classList.remove("is-open");
    notifyBtn.setAttribute("aria-expanded", "false");
  };

  const toggleNotify = () => {
    if (!notifyPop) return;
    notifyPop.classList.contains("is-open") ? closeNotify() : openNotify();
  };

  if (notifyBtn && notifyPop) {
    notifyBtn.addEventListener("click", (e) => {
      // nếu bạn muốn click chuông mở popup thay vì chuyển trang
      e.preventDefault();
      e.stopPropagation();

      // đóng user dropdown để không chồng UI
      close();

      toggleNotify();
    });

    if (notifyClose) {
      notifyClose.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeNotify();
      });
    }

    // click ngoài notify thì đóng (không ảnh hưởng click ngoài user menu)
    document.addEventListener("click", (e) => {
      if (!notifyPop.contains(e.target) && !notifyBtn.contains(e.target)) {
        closeNotify();
      }
    });

    // ESC đóng notify (không ảnh hưởng ESC đóng user dropdown vì cả 2 cùng đóng được)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNotify();
    });
  }

  // =========================================================
  // ✅ NEW: HAMBURGER + MOBILE MENU (không đụng code cũ)
  // =========================================================
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  const openMobileMenu = () => {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.add("is-open");
    hamburger.setAttribute("aria-expanded", "true");
  };

  const closeMobileMenu = () => {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove("is-open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  const toggleMobileMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.contains("is-open") ? closeMobileMenu() : openMobileMenu();
  };

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // đóng các popup khác để gọn UI
      close();
      closeNotify();

      toggleMobileMenu();
    });

    // click link trong mobile menu thì đóng
    mobileMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) closeMobileMenu();
    });

    // click ngoài mobile menu thì đóng
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // ESC đóng mobile menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileMenu();
    });
  }
});
