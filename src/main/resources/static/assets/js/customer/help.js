document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const toast = $("#helpToast");
  const toastText = $("#toastText");
  const showToast = (msg) => {
    if (!toast) 
      return;
    if (toastText) 
      toastText.textContent = msg || "Đã gửi yêu cầu. Dinio sẽ liên hệ sớm.";
    toast.classList.add("is-on");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-on"), 2400);
  };

  const smoothTo = (sel) => {
    const el = $(sel);
    if (!el) 
      return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setOpen = (item, open) => {
    const a = $(".faq-a", item);
    const icon = $(".faq-q i", item);
    if (!a) 
      return;

    if (open) {
      item.classList.add("is-open");
      const h = a.scrollHeight;
      a.style.height = h + "px";
      if (icon) 
        icon.style.transform = "rotate(180deg)";
    } else {
      item.classList.remove("is-open");
      a.style.height = "0px";
      if (icon) 
        icon.style.transform = "";
    }
  };

  const faqItems = $$(".faq-item");
  faqItems.forEach((it) => {
    const q = $(".faq-q", it);
    const a = $(".faq-a", it);
    if (!q || !a) 
      return;

    a.style.height = "0px";
    q.addEventListener("click", () => {
      const isOpen = it.classList.contains("is-open");
      faqItems.forEach((x) => x !== it && setOpen(x, false));
      setOpen(it, !isOpen);
    });
  });

  const faqSearch = $("#faqSearch");
  if (faqSearch) {
    faqSearch.addEventListener("input", () => {
      const key = faqSearch.value.trim().toLowerCase();
      let any = false;
      faqItems.forEach((it) => {
        const tags = (it.getAttribute("data-tags") || "").toLowerCase();
        const title = ($(".faq-q span", it)?.textContent || "").toLowerCase();
        const ok = !key || tags.includes(key) || title.includes(key);
        it.style.display = ok ? "" : "none";
        if (ok) 
          any = true;
      });
    });
  }

  $$(".help-quick-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const scroll = b.getAttribute("data-scroll");
      const openId = b.getAttribute("data-open");
      if (scroll) 
        smoothTo(scroll);
      if (openId) {
        setTimeout(() => {
          const target = document.getElementById(openId);
          if (target) 
            setOpen(target, true);
        }, 280);
      }
    });
  });

  const supportForm = $("#supportForm");
  if (supportForm) {
    supportForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Đã gửi yêu cầu. Dinio sẽ liên hệ sớm.");
      supportForm.reset();
    });
  }

  const fill = $("#btnFillDemo");
  if (fill && supportForm) {
    fill.addEventListener("click", () => {
      const name = supportForm.querySelector('input[name="name"]');
      const phone = supportForm.querySelector('input[name="phone"]');
      const type = supportForm.querySelector('select[name="type"]');
      const priority = supportForm.querySelector('select[name="priority"]');
      const msg = supportForm.querySelector('textarea[name="message"]');

      if (name) 
        name.value = "Khách Dinio";
      if (phone) 
        phone.value = "0900 000 000";
      if (type) 
        type.value = "Đổi giờ đặt bàn";
      if (priority) 
        priority.value = "Thường";
      if (msg) 
        msg.value = "Mình muốn đổi giờ đặt bàn từ 19:00 sang 20:00. Số khách: 2. Ghi chú: ngồi yên tĩnh.";
      showToast("Đã điền mẫu. Bạn kiểm tra lại rồi bấm Gửi.");
    });
  }

  window.addEventListener("resize", () => {
    $$(".faq-item.is-open").forEach((it) => {
      const a = $(".faq-a", it);
      if (a) a.style.height = a.scrollHeight + "px";
    });
  });
});
