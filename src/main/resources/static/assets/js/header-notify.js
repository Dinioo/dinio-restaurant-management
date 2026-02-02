document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("notifyBtn");
  const pop = document.getElementById("notifyPop");
  const list = document.getElementById("notifyList");
  const closeBtn = document.getElementById("notifyClose");
  const tabs = pop.querySelectorAll(".notify-tab");
  const badge = document.getElementById("notifyBadge");

  let data = [];

  const currentUserId = document.querySelector('meta[name="user-id"]')?.content;

  // Load initial notifications
  if (currentUserId) {
    fetch("/dinio/api/notifications/list")
      .then((res) => res.json())
      .then((notifications) => {
        data = notifications.map((n) => ({
          id: n.id,
          unread: !n.isRead,
          title: n.title,
          text: n.message,
          time: formatTime(n.createdAt),
          tag: getTagForType(n.type),
        }));
        render("all");
        syncBadge();
      })
      .catch((err) => console.error("Failed to load notifications:", err));

    // Setup SSE connection
    const source = new EventSource(
      `/dinio/api/notifications/subscribe/${currentUserId}`,
    );

    source.addEventListener("DINIO_NOTIFY", (event) => {
      const n = JSON.parse(event.data);

      if (window.successToast) successToast(n.message);

      const newNotify = {
        id: n.id,
        unread: true,
        title: n.title,
        text: n.message,
        time: "Vừa xong",
        tag: getTagForType(n.type),
      };

      data.unshift(newNotify);
      render("all");
      syncBadge();
    });

    source.onerror = (err) => {
      console.error("SSE connection error:", err);
    };
  }

  const getTagForType = (type) => {
    switch (type) {
      case "TICKET_READY":
        return "Bếp";
      case "ORDER_SENT_TO_KITCHEN":
        return "Order";
      case "PAYMENT_REQUESTED":
        return "Thanh toán";
      case "RESERVATION_CONFIRMED":
        return "Đặt bàn";
      default:
        return "Hệ thống";
    }
  };

  const formatTime = (datetime) => {
    const date = new Date(datetime);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);

    if (diff < 60) return diff + " phút";
    if (diff < 1440) return Math.floor(diff / 60) + " giờ";
    return Math.floor(diff / 1440) + " ngày";
  };

  const avatarFor = (tag) => {
    const s = (tag || "D").trim().toUpperCase();
    return s.length >= 2 ? s.slice(0, 2) : s.slice(0, 1);
  };

  const render = (filter = "all") => {
    const items = data.filter((n) => (filter === "unread" ? n.unread : true));
    list.innerHTML = items
      .map(
        (n) => `
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
    `,
      )
      .join("");
  };

  const syncBadge = () => {
    const unreadCount = data.filter((n) => n.unread).length;
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

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => {
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
    const n = data.find((x) => x.id === id);
    if (n && n.unread) {
      n.unread = false;
      item.classList.remove("is-unread");
      syncBadge();

      // Mark as read on server
      fetch(`/dinio/api/notifications/${id}/mark-read`, {
        method: "POST",
      }).catch((err) => console.error("Failed to mark as read:", err));
    }
  });

  render("all");
  syncBadge();
});
