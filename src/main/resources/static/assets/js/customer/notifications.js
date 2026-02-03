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
    { id: 1, unread: true, bucket: "new", title: "Xác nhận đặt bàn", text: "Đặt bàn RSV-1 đã được xác nhận.", time: "1 giờ", tag: "Reservation" },
    { id: 2, unread: true, bucket: "new", title: "Ưu đãi cuối tuần", text: "Giảm 10% cho hoá đơn từ 2 khách.", time: "3 giờ", tag: "Promo" },
    { id: 3, unread: true, bucket: "new", title: "Nhắc nhở", text: "Bạn có thể đến sớm 10 phút.", time: "5 giờ", tag: "Notice" },
    { id: 4, unread: false, bucket: "old", title: "Món mới", text: "Bếp vừa ra mắt 3 món mới.", time: "2 ngày", tag: "Menu" },
    { id: 5, unread: false, bucket: "old", title: "Cập nhật đặt bàn", text: "Thay đổi số khách RSV-1.", time: "3 ngày", tag: "Reservation" },
    { id: 6, unread: false, bucket: "old", title: "Gợi ý", text: "Thử Salmon Teriyaki.", time: "5 ngày", tag: "Suggest" },
    { id: 7, unread: false, bucket: "old", title: "Ưu đãi thành viên", text: "Tích điểm đổi quà.", time: "1 tuần", tag: "Promo" },
    { id: 8, unread: false, bucket: "old", title: "Giờ cao điểm", text: "Khung 19:00 đông khách.", time: "2 tuần", tag: "Notice" }
  ];

  const avatarFor = (tag) => (String(tag || "D").trim().toUpperCase().slice(0, 2));
  
  const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const matches = (n, q) => {
    if (!q) 
      return true;
    const t = (n.title + " " + n.text + " " + n.tag).toLowerCase();
    return t.includes(q.toLowerCase());
  };

  const applyFilter = (arr) => {
    const q = query ? query.value.trim() : "";
    return arr.filter(n => filter === "unread" ? n.unread : true).filter(n => matches(n, q));
  };

  const itemHtml = (n) => `
    <div class="ntf-item ${n.unread ? "is-unread" : ""}" data-id="${n.id}">
      <div class="ntf-avatar">${avatarFor(n.tag)}</div>
      <div class="ntf-body">
        <div class="ntf-line">
          <div class="ntf-text"><strong>${escapeHtml(n.title)}:</strong> ${escapeHtml(n.text)}</div>
          <span class="ntf-dot" aria-hidden="true"></span>
        </div>
        <div class="ntf-meta"><span>${escapeHtml(n.time)}</span><span class="ntf-pill">${escapeHtml(n.tag)}</span></div>
      </div>
      <div class="ntf-right">
        <button class="ntf-mini" type="button" data-act="toggle"><i class="fa-regular fa-circle-check"></i></button>
        <button class="ntf-mini" type="button" data-act="remove"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    </div>`;

  const render = () => {
    if (!listNew || !listOld) 
      return;

    const newItems = applyFilter(data.filter(n => n.bucket === "new")).slice(0, limit);
    const oldItems = applyFilter(data.filter(n => n.bucket === "old")).slice(0, limit);

    listNew.innerHTML = newItems.map(itemHtml).join("");
    listOld.innerHTML = oldItems.map(itemHtml).join("");

    if (countNew) 
      countNew.textContent = String(applyFilter(data.filter(n => n.bucket === "new")).length);
    if (countOld) 
      countOld.textContent = String(applyFilter(data.filter(n => n.bucket === "old")).length);

    const totalShown = newItems.length + oldItems.length;
    const totalAvailable = applyFilter(data).length;
    
    if (btnMore) {
        btnMore.style.display = totalShown < Math.min(totalAvailable, limit * 2) ? "none" : "block";
        if (applyFilter(data).length > limit * 2) 
          btnMore.style.display = "block";
    }
  };

  const updateHeaderBadge = () => {
    const btn = document.getElementById("notifyBtn");
    const badge = document.getElementById("notifyBadge");
    
    if (!btn || !badge) return;

    const unreadCount = data.filter(x => x.unread).length;
    btn.classList.toggle("has-unread", unreadCount > 0);
    
    if (unreadCount > 0) {
        badge.style.display = "flex"; 
        badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
    } else {
        badge.style.display = "none";
    }
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

  if (tabs.length > 0) {
      tabs.forEach(t => t.addEventListener("click", () => setActiveTab(t.dataset.filter || "all")));
  }

  if (query) {
      query.addEventListener("input", () => {
        limit = 6;
        render();
      });
  }

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
      if (act === "toggle") 
        n.unread = !n.unread;
      else if (act === "remove") {
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

  if (listNew) 
    listNew.addEventListener("click", onListClick);
  if (listOld) 
    listOld.addEventListener("click", onListClick);

  if (btnMarkAll) {
      btnMarkAll.addEventListener("click", () => {
        data.forEach(n => (n.unread = false));
        render();
        updateHeaderBadge();
      });
  }

  if (btnClearRead) {
      btnClearRead.addEventListener("click", () => {
        for (let i = data.length - 1; i >= 0; i--) {
          if (!data[i].unread) 
            data.splice(i, 1);
        }
        render();
        updateHeaderBadge();
      });
  }

  if (btnMore) {
      btnMore.addEventListener("click", () => {
        limit += 6;
        render();
      });
  }

  render();           
  updateHeaderBadge();
});