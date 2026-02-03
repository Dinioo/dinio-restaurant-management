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

  const data = [
    { id: 1, unread: true, bucket: "new", title: "Xác nhận đặt bàn", text: "Đặt bàn RSV-1 đã được xác nhận cho 19:00 hôm nay.", time: "1 giờ", tag: "Reservation" },
    { id: 2, unread: true, bucket: "new", title: "Ưu đãi cuối tuần", text: "Giảm 10% cho hoá đơn từ 2 khách. Áp dụng đến CN.", time: "3 giờ", tag: "Promo" },
    { id: 3, unread: true, bucket: "new", title: "Nhắc nhở", text: "Bạn có thể đến sớm 10 phút để nhận bàn nhanh hơn.", time: "5 giờ", tag: "Notice" },

    { id: 4, unread: false, bucket: "old", title: "Món mới", text: "Bếp vừa ra mắt 3 món mới trong thực đơn mùa này.", time: "2 ngày", tag: "Menu" },
    { id: 5, unread: false, bucket: "old", title: "Cập nhật đặt bàn", text: "Bạn đã thay đổi số khách cho RSV-1 thành 4 khách.", time: "3 ngày", tag: "Reservation" },
    { id: 6, unread: false, bucket: "old", title: "Gợi ý", text: "Thử Salmon Teriyaki cho bữa tối nhẹ nhàng, hợp vị.", time: "5 ngày", tag: "Suggest" },
    { id: 7, unread: false, bucket: "old", title: "Ưu đãi thành viên", text: "Tích điểm mỗi hoá đơn để đổi món tráng miệng miễn phí.", time: "1 tuần", tag: "Promo" },
    { id: 8, unread: false, bucket: "old", title: "Giờ cao điểm", text: "Khung 19:00–20:30 thường đông, bạn nên đặt trước.", time: "2 tuần", tag: "Notice" }
  ];

  const avatarFor = (tag) => {
    const s = String(tag || "D").trim().toUpperCase();
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
    if (!q) 
      return true;
    const t = (n.title + " " + n.text + " " + n.tag).toLowerCase();
    return t.includes(q.toLowerCase());
  };

  const applyFilter = (arr) => {
    const q = query.value.trim();
    return arr
      .filter(n => filter === "unread" ? n.unread : true)
      .filter(n => matches(n, q));
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
    const newItems = applyFilter(data.filter(n => n.bucket === "new")).slice(0, limit);
    const oldItems = applyFilter(data.filter(n => n.bucket === "old")).slice(0, limit);

    listNew.innerHTML = newItems.map(itemHtml).join("");
    listOld.innerHTML = oldItems.map(itemHtml).join("");

    countNew.textContent = String(applyFilter(data.filter(n => n.bucket === "new")).length);
    countOld.textContent = String(applyFilter(data.filter(n => n.bucket === "old")).length);

    const totalShown = newItems.length + oldItems.length;
    const totalAvailable = applyFilter(data).length;
    btnMore.style.display = totalShown < Math.min(totalAvailable, limit * 2) ? "none" : "block";
    if (applyFilter(data).length > limit * 2) 
      btnMore.style.display = "block";
  };

  const updateHeaderBadge = () => {
    const btn = document.getElementById("notifyBtn");
    const badge = document.getElementById("notifyBadge");
    if (!btn || !badge) 
      return;
    const unreadCount = data.filter(x => x.unread).length;
    btn.classList.toggle("has-unread", unreadCount > 0);
    badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
  };

  const setActiveTab = (next) => {
    filter = next;
    tabs.forEach(t => {
      const on = t.dataset.filter === next;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    limit = 6;
    render();
  };

  tabs.forEach(t => {
    t.addEventListener("click", () => setActiveTab(t.dataset.filter || "all"));
  });

  query.addEventListener("input", () => {
    limit = 6;
    render();
  });

  const onListClick = (e) => {
    const item = e.target.closest(".ntf-item");
    if (!item) 
      return;
    const id = Number(item.dataset.id);
    const n = data.find(x => x.id === id);
    if (!n) 
      return;

    const actBtn = e.target.closest("button[data-act]");
    if (actBtn) {
      const act = actBtn.dataset.act;
      if (act === "toggle") {
        n.unread = !n.unread;
      } else if (act === "remove") {
        const idx = data.findIndex(x => x.id === id);
        if (idx >= 0)
           data.splice(idx, 1);
      }
    } else {
      n.unread = false;
    }

    render();
    updateHeaderBadge();
  };

  listNew.addEventListener("click", onListClick);
  listOld.addEventListener("click", onListClick);

  btnMarkAll.addEventListener("click", () => {
    data.forEach(n => (n.unread = false));
    render();
    updateHeaderBadge();
  });

  btnClearRead.addEventListener("click", () => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (!data[i].unread) 
        data.splice(i, 1);
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
