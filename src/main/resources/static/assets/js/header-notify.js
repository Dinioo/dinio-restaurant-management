document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("notifyBtn");
  const pop = document.getElementById("notifyPop");
  const list = document.getElementById("notifyList");
  const closeBtn = document.getElementById("notifyClose");
  const tabs = pop.querySelectorAll(".notify-tab");
  const badge = document.getElementById("notifyBadge");

  const data = [
    { id: 1, unread: true, type: "reservation", title: "Xác nhận đặt bàn", text: "Đặt bàn RSV-1 đã được xác nhận cho 19:00 hôm nay.", time: "1 giờ", tag: "Reservation" },
    { id: 2, unread: true, type: "promo", title: "Ưu đãi cuối tuần", text: "Giảm 10% cho hoá đơn từ 2 khách. Áp dụng đến CN.", time: "3 giờ", tag: "Promo" },
    { id: 3, unread: false, type: "service", title: "Nhắc nhở", text: "Bạn có thể đến sớm 10 phút để nhận bàn nhanh hơn.", time: "Hôm qua", tag: "Notice" },
    { id: 4, unread: false, type: "menu", title: "Món mới", text: "Bếp vừa ra mắt 3 món mới trong thực đơn mùa này.", time: "2 ngày", tag: "Menu" }
  ];

  const avatarFor = (tag) => {
    const s = (tag || "D").trim().toUpperCase();
    return s.length >= 2 ? s.slice(0, 2) : s.slice(0, 1);
  };

  const render = (filter = "all") => {
    const items = data.filter(n => filter === "unread" ? n.unread : true);
    list.innerHTML = items.map(n => `
      <div class="notify-item ${n.unread ? "is-unread" : ""}" data-id="${n.id}">
        <div class="notify-avatar">${avatarFor(n.tag)}</div>
        <div class="notify-body">
          <div class="notify-line">
            <div class="notify-text"><strong>${n.title}:</strong> ${n.text}</div>
            <span class="notify-unread" aria-hidden="true"></span>
          </div>
          <div class="notify-meta">
            <span>${n.time}</span>
            <span class="notify-pill">${n.tag}</span>
          </div>
        </div>
      </div>
    `).join("");
  };

  const syncBadge = () => {
    const unreadCount = data.filter(n => n.unread).length;
    btn.classList.toggle("has-unread", unreadCount > 0);
    if (badge) badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
  };

  const open = () => {
    pop.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    pop.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };

  const toggle = () => (pop.classList.contains("is-open") ? close() : open());

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  closeBtn.addEventListener("click", () => close());

  document.addEventListener("click", (e) => {
    if (!pop.classList.contains("is-open")) return;
    const inside = pop.contains(e.target) || btn.contains(e.target);
    if (!inside) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => {
        x.classList.remove("is-active");
        x.setAttribute("aria-selected", "false");
      });
      t.classList.add("is-active");
      t.setAttribute("aria-selected", "true");
      render(t.dataset.filter || "all");
    });
  });

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".notify-item");
    if (!item) return;
    const id = Number(item.dataset.id);
    const n = data.find(x => x.id === id);
    if (n) n.unread = false;
    item.classList.remove("is-unread");
    syncBadge();
  });

  render("all");
  syncBadge();
});
