document.addEventListener("DOMContentLoaded", () => {
  const $ = (q, p = document) => p.querySelector(q);
  const $$ = (q, p = document) => Array.from(p.querySelectorAll(q));
  const viDate = (iso) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  const posts = [
    {
      id: "p1",
      title: "Một buổi tối bận rộn và cách bếp giữ nhịp",
      topic: "Hậu trường",
      date: "2026-01-28",
      readMin: 5,
      featured: true,
      excerpt:
        "Khi đơn dồn dập, điều quan trọng nhất là nhịp — từ prep, pass cho đến plating. Đây là cách team giữ chất lượng đồng đều.",
      content: [
        { t: "p", v: "Có những tối nhà hàng đông đến mức bạn nghe tiếng dao thớt như một bản nhạc. Nhịp là thứ giữ mọi thứ không vỡ." },
        { t: "h3", v: "1. Prep chuẩn trước giờ cao điểm" },
        { t: "p", v: "Chuẩn hoá theo checklist: sốt nền, garnish, batch nguyên liệu. Khi vào rush, bếp chỉ còn việc lắp ghép." },
        { t: "h3", v: "2. Pass rõ ràng" },
        { t: "p", v: "Mỗi món qua pass cần 3 kiểm: nhiệt độ, hình thức, timing." },
        { t: "h3", v: "3. Một nguyên tắc nhỏ" },
        { t: "p", v: "Nhanh không có nghĩa là vội. Nhanh là ít sai, ít sửa, ít chờ." }
      ]
    },
    {
      id: "p2",
      title: "Vì sao Dinio chọn nguyên liệu theo mùa",
      topic: "Nguyên liệu",
      date: "2026-01-20",
      readMin: 4,
      featured: true,
      excerpt:
        "Theo mùa giúp hương vị đậm hơn, giá ổn hơn và menu luôn có cảm giác mới. Đây là nguyên tắc khiến món đơn giản nhưng có chiều sâu.",
      content: [
        { t: "p", v: "Nguyên liệu theo mùa thường ngon nhất ở đúng thời điểm của nó. Không cần quá nhiều kỹ thuật để làm nó nổi bật." },
        { t: "h3", v: "Chọn ít nhưng đúng" },
        { t: "p", v: "Một món ngon thường có 1–2 điểm nhấn. Đừng nhồi quá nhiều thứ lên đĩa." },
        { t: "h3", v: "Gợi ý khi đọc menu" },
        { t: "ul", v: ["Ưu tiên món có nguyên liệu 'đang mùa'", "Hỏi nhân viên về pairing đồ uống", "Chọn món có thời gian ra nhanh nếu đi nhóm đông"] }
      ]
    },
    {
      id: "p3",
      title: "3 nguyên tắc làm sốt bơ chanh không bị tách",
      topic: "Kỹ thuật",
      date: "2026-01-14",
      readMin: 3,
      featured: false,
      excerpt:
        "Sốt bơ chanh ngon là mượt, bóng và thơm. Chỉ cần kiểm nhiệt, thứ tự và nhũ hoá đúng, bạn sẽ không còn gặp tình trạng tách dầu.",
      content: [
        { t: "p", v: "Nếu nhiệt quá cao, bơ tách. Nếu acid vào sai lúc, sốt gãy. Mấu chốt là kiểm soát." },
        { t: "ul", v: ["Giữ lửa nhỏ, tắt bếp trước khi cho bơ", "Cho bơ lạnh từng phần và whisk liên tục", "Chanh vào cuối, nêm từng chút"] }
      ]
    },
    {
      id: "p4",
      title: "Một ngày của đội phục vụ: từ set bàn đến chốt ca",
      topic: "Phục vụ",
      date: "2026-01-09",
      readMin: 6,
      featured: true,
      excerpt:
        "Trước khi khách đến, mọi thứ đã được chuẩn bị tỉ mỉ. Đây là quy trình nhỏ giúp dịch vụ đồng nhất và trải nghiệm trơn tru.",
      content: [
        { t: "p", v: "Phục vụ tốt không bắt đầu từ lúc khách gọi món. Nó bắt đầu từ việc set bàn, kiểm hàng và phối hợp." },
        { t: "h3", v: "Check nhanh trước ca" },
        { t: "ul", v: ["Đủ dụng cụ, khăn, nước", "Brief món đặc biệt hôm nay", "Phân khu và backup"] }
      ]
    },
    {
      id: "p5",
      title: "Tối giản plating: làm sao để món nhìn ‘đắt’ hơn",
      topic: "Cảm hứng",
      date: "2026-01-02",
      readMin: 4,
      featured: false,
      excerpt:
        "Plating không cần cầu kỳ. Chỉ cần bố cục rõ, khoảng thở tốt và một điểm nhấn đúng chất liệu.",
      content: [
        { t: "p", v: "Khoảng trống trên đĩa là một phần của thiết kế. Đừng sợ để trống." },
        { t: "ul", v: ["Chọn 1 điểm nhấn (sốt / garnish)", "Giữ 2–3 màu chủ đạo", "Dùng texture để tạo tương phản"] }
      ]
    }
  ];

  const state = {
    q: "",
    topic: "all",
    sort: "newest"
  };

  const el = {
    list: $("#storyList"),
    empty: $("#storyEmpty"),
    count: $("#storyCount"),
    featured: $("#featuredList"),
    featuredCount: $("#featuredCount"),
    tags: $("#topicTags"),
    search: $("#storySearch"),
    clear: $(".story-clear"),
    sort: $("#storySort"),
    reset: $("#storyReset"),
    modal: $("#storyModal"),
    modalClose: $("#modalClose"),
    modalTitle: $("#modalTitle"),
    modalHero: $("#modalHero"),
    modalTopic: $("#modalTopic"),
    modalDate: $("#modalDate"),
    modalRead: $("#modalRead"),
    modalContent: $("#modalContent")
  };

  const topics = ["all", ...Array.from(new Set(posts.map(p => p.topic)))];

  const score = (p) => (p.featured ? 100 : 0) + (p.readMin <= 4 ? 10 : 0);

  const apply = () => {
    let items = posts.slice();

    if (state.topic !== "all") items = items.filter(p => p.topic === state.topic);

    const q = state.q.trim().toLowerCase();
    if (q) {
      items = items.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q)
      );
    }

    if (state.sort === "newest") items.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (state.sort === "popular") items.sort((a, b) => score(b) - score(a));
    if (state.sort === "readtime") items.sort((a, b) => a.readMin - b.readMin);

    renderList(items);
  };

  const renderList = (items) => {
    el.count.textContent = String(items.length);
    el.empty.classList.toggle("is-hidden", items.length !== 0);

    el.list.innerHTML = items.map(p => `
      <article class="story-card" data-open="${p.id}">
        <div class="story-thumb" aria-hidden="true">
          <span class="t"><i class="fa-regular fa-bookmark"></i>${p.topic}</span>
        </div>
        <div class="story-main">
          <h3 class="story-title">${escapeHtml(p.title)}</h3>
          <p class="story-excerpt">${escapeHtml(p.excerpt)}</p>
          <div class="story-row">
            <div class="story-meta">
              <span class="meta-pill">${escapeHtml(p.topic)}</span>
              <span class="meta-dot">•</span>
              <span>${viDate(p.date)}</span>
              <span class="meta-dot">•</span>
              <span>${p.readMin} phút đọc</span>
            </div>
            <button class="story-open" type="button" data-openbtn="${p.id}">
              Đọc <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </article>
    `).join("");

    $$("[data-openbtn], [data-open]", el.list).forEach(n => {
      n.addEventListener("click", (e) => {
        const id = n.getAttribute("data-openbtn") || n.getAttribute("data-open");
        if (!id) return;
        openModal(id);
      });
    });
  };

  const renderFeatured = () => {
    const feat = posts.filter(p => p.featured).sort((a, b) => new Date(b.date) - new Date(a.date));
    el.featuredCount.textContent = String(feat.length);
    el.featured.innerHTML = feat.map((p, i) => `
      <div class="side-item" role="button" tabindex="0" data-openfeat="${p.id}">
        <div class="side-dot"><i class="fa-solid fa-star"></i></div>
        <div class="side-text">
          <p class="side-h">${escapeHtml(p.title)}</p>
          <p class="side-m">${escapeHtml(p.topic)} • ${viDate(p.date)}</p>
        </div>
      </div>
    `).join("");

    $$("[data-openfeat]", el.featured).forEach(n => {
      n.addEventListener("click", () => openModal(n.getAttribute("data-openfeat")));
      n.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openModal(n.getAttribute("data-openfeat"));
      });
    });
  };

  const renderTags = () => {
    el.tags.innerHTML = topics.map(t => `
      <button class="topic-tag ${t === state.topic ? "is-active" : ""}" type="button" data-topic="${t}">
        ${t === "all" ? "Tất cả" : escapeHtml(t)}
      </button>
    `).join("");

    $$("[data-topic]", el.tags).forEach(b => {
      b.addEventListener("click", () => {
        state.topic = b.getAttribute("data-topic");
        renderTags();
        apply();
      });
    });
  };

  const openModal = (id) => {
    const p = posts.find(x => x.id === id);
    if (!p) return;

    el.modalTitle.textContent = p.title;
    el.modalTopic.textContent = p.topic;
    el.modalDate.textContent = viDate(p.date);
    el.modalRead.textContent = `${p.readMin} phút đọc`;

    el.modalContent.innerHTML = p.content.map(block => {
      if (block.t === "h3") return `<h3>${escapeHtml(block.v)}</h3>`;
      if (block.t === "ul") return `<ul>${block.v.map(li => `<li>${escapeHtml(li)}</li>`).join("")}</ul>`;
      return `<p>${escapeHtml(block.v)}</p>`;
    }).join("");

    el.modal.classList.remove("is-hidden");
    el.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    el.modal.classList.add("is-hidden");
    el.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  el.search.addEventListener("input", () => {
    state.q = el.search.value || "";
    apply();
  });

  el.clear.addEventListener("click", () => {
    el.search.value = "";
    state.q = "";
    apply();
    el.search.focus();
  });

  el.sort.addEventListener("change", () => {
    state.sort = el.sort.value;
    apply();
  });

  el.reset.addEventListener("click", () => {
    state.q = "";
    state.topic = "all";
    state.sort = "newest";
    el.search.value = "";
    el.sort.value = "newest";
    renderTags();
    apply();
  });

  el.modalClose.addEventListener("click", closeModal);
  el.modal.addEventListener("click", (e) => {
    const close = e.target && e.target.getAttribute && e.target.getAttribute("data-close");
    if (close) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.modal.classList.contains("is-hidden")) closeModal();
  });

  renderFeatured();
  renderTags();
  apply();
});
