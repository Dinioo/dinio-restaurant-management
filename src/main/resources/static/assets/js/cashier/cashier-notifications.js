document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const listNew = $("listNew");
  const listOld = $("listOld");
  const countNew = $("countNew");
  const countOld = $("countOld");
  const btnMore = $("btnMore");
  const btnMarkAll = $("btnMarkAll");
  const btnClearRead = $("btnClearRead");
  const query = $("ntfQuery");
  const tabs = document.querySelectorAll(".ntf-tab");

  let filter = "all";
  let limit = 6;
  let data = [];

  // Cashier chỉ xem: PAYMENT_REQUESTED, NEW_RESERVATION
  const CASHIER_TYPES = ["PAYMENT_REQUESTED", "NEW_RESERVATION"];

  const currentUserId = document.querySelector('meta[name="user-id"]')?.content;

  if (currentUserId) {
    fetch("/dinio/api/notifications/list")
      .then((res) => res.json())
      .then((notifications) => {
        const filtered = notifications.filter((n) =>
          CASHIER_TYPES.includes(n.type),
        );

        data = filtered.map((n) => {
          const isNew = isRecentNotification(n.createdAt);
          return {
            id: n.id,
            unread: !n.isRead,
            bucket: isNew ? "new" : "old",
            title: n.title,
            text: n.message,
            time: formatTime(n.createdAt),
            tag: getTagForType(n.type),
            type: n.type,
          };
        });

        render();
        updateHeaderBadge();
      })
      .catch((err) => console.error("Failed to load notifications:", err));

    const source = new EventSource(
      `/dinio/api/notifications/subscribe/${currentUserId}`,
    );

    source.addEventListener("DINIO_NOTIFY", (event) => {
      const n = JSON.parse(event.data);

      if (!CASHIER_TYPES.includes(n.type)) return;

      if (window.successToast) successToast(n.message);

      const newNotify = {
        id: n.id,
        unread: true,
        bucket: "new",
        title: n.title,
        text: n.message,
        time: "Vừa xong",
        tag: getTagForType(n.type),
        type: n.type,
      };

      data.unshift(newNotify);
      render();
      updateHeaderBadge();
    });

    source.onerror = (err) => {
      console.error("SSE connection error:", err);
    };
  }

  const isRecentNotification = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now - date) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const getTagForType = (type) => {
    switch (type) {
      case "PAYMENT_REQUESTED":
        return "Thanh toán";
      case "NEW_RESERVATION":
        return "Đặt bàn";
      default:
        return "Thông báo";
    }
  };

  const formatTime = (datetime) => {
    const date = new Date(datetime);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);

    if (diff < 1) return "Vừa xong";
    if (diff < 60) return diff + " phút";
    if (diff < 1440) return Math.floor(diff / 60) + " giờ";
    return Math.floor(diff / 1440) + " ngày";
  };

  const avatarFor = (tag) => {
    const s = String(tag || "D")
      .trim()
      .toUpperCase();
    return s.length >= 2 ? s.slice(0, 2) : s.slice(0, 1);
  };

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const matches = (n, q) => {
    if (!q) return true;
    const t = (n.title + " " + n.text + " " + n.tag).toLowerCase();
    return t.includes(q.toLowerCase());
  };

  const applyFilter = (arr) => {
    const q = query.value.trim();
    return arr
      .filter((n) => (filter === "unread" ? n.unread : true))
      .filter((n) => matches(n, q));
  };

  const itemHtml = (n) => `
    <div class="ntf-item ${n.unread ? "is-unread" : ""}" data-id="${n.id}">
      <div class="ntf-avatar">${avatarFor(n.tag)}</div>
      <div class="ntf-body">
        <div class="ntf-line">
          <div class="ntf-text"><strong>${escapeHtml(n.title)}:</strong> ${escapeHtml(n.text)}</div>
          <span class="ntf-dot" aria-hidden="true"></span>
        </div>
        <div class="ntf-meta">
          <span>${escapeHtml(n.time)}</span>
          <span class="ntf-pill">${escapeHtml(n.tag)}</span>
        </div>
      </div>
      <div class="ntf-right">
        <button class="ntf-mini" type="button" data-act="toggle" aria-label="Đánh dấu đã đọc/chưa đọc">
          <i class="fa-regular fa-circle-check"></i>
        </button>
        <button class="ntf-mini" type="button" data-act="remove" aria-label="Xoá thông báo">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;

  const render = () => {
    const newItems = applyFilter(data.filter((n) => n.bucket === "new")).slice(
      0,
      limit,
    );
    const oldItems = applyFilter(data.filter((n) => n.bucket === "old")).slice(
      0,
      limit,
    );

    listNew.innerHTML = newItems.map(itemHtml).join("");
    listOld.innerHTML = oldItems.map(itemHtml).join("");

    countNew.textContent = String(
      applyFilter(data.filter((n) => n.bucket === "new")).length,
    );
    countOld.textContent = String(
      applyFilter(data.filter((n) => n.bucket === "old")).length,
    );

    const totalShown = newItems.length + oldItems.length;
    const totalAvailable = applyFilter(data).length;
    btnMore.style.display =
      totalShown < Math.min(totalAvailable, limit * 2) ? "none" : "block";
    if (applyFilter(data).length > limit * 2) btnMore.style.display = "block";
  };

  const updateHeaderBadge = () => {
    const btn = document.getElementById("notifyBtn");
    const badge = document.getElementById("notifyBadge");
    if (!btn || !badge) return;
    const unreadCount = data.filter((x) => x.unread).length;
    btn.classList.toggle("has-unread", unreadCount > 0);
    badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
  };

  const setActiveTab = (next) => {
    filter = next;
    tabs.forEach((t) => {
      const on = t.dataset.filter === next;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    limit = 6;
    render();
  };

  tabs.forEach((t) => {
    t.addEventListener("click", () => setActiveTab(t.dataset.filter || "all"));
  });

  query.addEventListener("input", () => {
    limit = 6;
    render();
  });

  const onListClick = (e) => {
    const item = e.target.closest(".ntf-item");
    if (!item) return;
    const id = Number(item.dataset.id);
    const n = data.find((x) => x.id === id);
    if (!n) return;

    const actBtn = e.target.closest("button[data-act]");
    if (actBtn) {
      const act = actBtn.dataset.act;
      if (act === "toggle") {
        n.unread = !n.unread;
        fetch(`/dinio/api/notifications/${id}/mark-read`, {
          method: "POST",
        }).catch((err) => console.error("Failed to mark as read:", err));
      } else if (act === "remove") {
        const idx = data.findIndex((x) => x.id === id);
        if (idx >= 0) data.splice(idx, 1);
      }
    } else {
      if (n.unread) {
        n.unread = false;
        fetch(`/dinio/api/notifications/${id}/mark-read`, {
          method: "POST",
        }).catch((err) => console.error("Failed to mark as read:", err));
      }
    }

    render();
    updateHeaderBadge();
  };

  listNew.addEventListener("click", onListClick);
  listOld.addEventListener("click", onListClick);

  btnMarkAll.addEventListener("click", () => {
    data.forEach((n) => (n.unread = false));
    render();
    updateHeaderBadge();
  });

  btnClearRead.addEventListener("click", () => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (!data[i].unread) data.splice(i, 1);
    }
    render();
    updateHeaderBadge();
  });

  btnMore.addEventListener("click", () => {
    limit += 6;
    render();
  });

  render();
  updateHeaderBadge();
});
