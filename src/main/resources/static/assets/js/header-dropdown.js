document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.getElementById("userMenu");
  const btn = document.getElementById("userBtn");
  const dd  = document.getElementById("userDropdown");

  if (!wrap || !btn || !dd) 
    return;

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
    if (!wrap.contains(e.target)) 
      close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") 
      close();
  });

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
    if (!notifyPop) 
      return;
    notifyPop.classList.contains("is-open") ? closeNotify() : openNotify();
  };

  if (notifyBtn && notifyPop) {
    notifyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

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

    document.addEventListener("click", (e) => {
      if (!notifyPop.contains(e.target) && !notifyBtn.contains(e.target)) {
        closeNotify();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") 
        closeNotify();
    });
  }

  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  const openMobileMenu = () => {
    if (!mobileMenu || !hamburger) 
      return;
    mobileMenu.classList.add("is-open");
    hamburger.setAttribute("aria-expanded", "true");
  };

  const closeMobileMenu = () => {
    if (!mobileMenu || !hamburger) 
      return;
    mobileMenu.classList.remove("is-open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  const toggleMobileMenu = () => {
    if (!mobileMenu) 
      return;
    mobileMenu.classList.contains("is-open") ? closeMobileMenu() : openMobileMenu();
  };

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      close();
      closeNotify();

      toggleMobileMenu();
    });

    mobileMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) closeMobileMenu();
    });

    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMobileMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileMenu();
    });
  }
});
