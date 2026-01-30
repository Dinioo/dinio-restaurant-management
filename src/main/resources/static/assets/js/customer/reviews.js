document.addEventListener("DOMContentLoaded", () => {
  const $ = (q, p = document) => p.querySelector(q);
  const $$ = (q, p = document) => Array.from(p.querySelectorAll(q));

  const el = {
    form: $("#reviewForm"),
    mode: $("#rvMode"),
    name: $("#rvName"),
    dish: $("#rvDish"),
    visit: $("#rvVisit"),
    msg: $("#rvMsg"),
    rating: $("#rvRating"),
    starLabel: $("#starLabel"),
    stars: $$(".rv-star"),
    addPhotosBtn: $("#btnAddPhotos"),
    photoInput: $("#rvPhotos"),
    photoGrid: $("#photoGrid"),
    fillDemo: $("#btnFillDemo"),
    list: $("#reviewList"),
    filter: $("#filterStars"),
    resetFilter: $("#btnResetFilter"),
    toast: $("#rvToast"),
    toastClose: $("#toastClose"),
    toastTitle: $("#toastTitle"),
    toastSub: $("#toastSub"),
    avgScore: $("#avgScore"),
    totalReviews: $("#totalReviews"),
    totalPhotos: $("#totalPhotos"),
    shuffle: $("#btnShuffle"),
    gallery: $("#featuredGallery")
  };

  const state = {
    files: [],
    selectedStar: 0,
    reviews: []
  };

  const labels = {
    1: "Tệ",
    2: "Chưa ổn",
    3: "Ổn",
    4: "Tốt",
    5: "Xuất sắc"
  };

  const showToast = (title, sub) => {
    el.toastTitle.textContent = title;
    el.toastSub.textContent = sub;
    el.toast.classList.remove("is-hidden");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => el.toast.classList.add("is-hidden"), 3200);
  };

  const clampPhotos = (arr) => arr.slice(0, 6);

  const setStars = (n) => {
    state.selectedStar = n;
    el.rating.value = String(n);
    el.starLabel.textContent = n ? `${n}/5 • ${labels[n] || ""}` : "Chưa chọn";
    el.stars.forEach((b) => {
      const s = Number(b.getAttribute("data-star"));
      b.classList.toggle("is-on", s <= n);
    });
  };

  el.stars.forEach((b) => {
    b.addEventListener("click", () => setStars(Number(b.getAttribute("data-star"))));
    b.addEventListener("mouseenter", () => {
      const n = Number(b.getAttribute("data-star"));
      el.stars.forEach((x) => {
        const s = Number(x.getAttribute("data-star"));
        x.classList.toggle("is-on", s <= n);
      });
      el.starLabel.textContent = `${n}/5 • ${labels[n] || ""}`;
    });
  });

  $("#starPicker").addEventListener("mouseleave", () => setStars(state.selectedStar));

  const renderPhotoGrid = () => {
    el.photoGrid.innerHTML = "";
    state.files.forEach((f, idx) => {
      const url = URL.createObjectURL(f);
      const node = document.createElement("div");
      node.className = "rv-photo";
      node.innerHTML = `
        <img alt="photo" src="${url}">
        <button class="rv-photo-x" type="button" aria-label="Remove" data-idx="${idx}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      el.photoGrid.appendChild(node);
    });

    $$(".rv-photo-x", el.photoGrid).forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-idx"));
        state.files = state.files.filter((_, i) => i !== idx);
        renderPhotoGrid();
      });
    });
  };

  el.addPhotosBtn.addEventListener("click", () => el.photoInput.click());

  el.photoInput.addEventListener("change", () => {
    const incoming = Array.from(el.photoInput.files || []);
    const merged = clampPhotos([...state.files, ...incoming]);
    state.files = merged;
    el.photoInput.value = "";
    renderPhotoGrid();
  });

  const starsHtml = (n) => {
    const full = Array.from({ length: n }).map(() => `<i class="fa-solid fa-star"></i>`).join("");
    const empty = Array.from({ length: 5 - n }).map(() => `<i class="fa-regular fa-star"></i>`).join("");
    return `${full}${empty}`;
  };

  const cardPhotos = (files) => {
    if (!files || !files.length) return "";
    const imgs = files.slice(0, 4).map((f) => `<div class="ph"><img alt="photo" src="${f}"></div>`).join("");
    return `<div class="rv-item-photos">${imgs}</div>`;
  };

  const formatTime = (d) => {
    const pad = (x) => String(x).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const calcStats = () => {
    const list = state.reviews;
    const total = list.length;
    const avg = total ? (list.reduce((a, r) => a + r.rating, 0) / total) : 0;
    const photos = list.reduce((a, r) => a + (r.photos ? r.photos.length : 0), 0);
    el.totalReviews.textContent = String(total);
    el.avgScore.textContent = avg ? avg.toFixed(1) : "0.0";
    el.totalPhotos.textContent = String(photos);
  };

  const renderList = () => {
    const f = el.filter.value;
    const items = f === "all" ? state.reviews : state.reviews.filter((r) => String(r.rating) === f);

    el.list.innerHTML = items.map((r) => {
      const dish = r.dish ? `• ${r.dish}` : "";
      return `
        <article class="rv-item" data-rating="${r.rating}">
          <div class="rv-item-top">
            <div>
              <p class="rv-item-name">${r.name}</p>
              <p class="rv-item-meta">${r.time} • ${labels[r.rating] || ""} ${dish}</p>
            </div>
            <div class="rv-item-stars" aria-label="${r.rating} sao">
              ${starsHtml(r.rating)}
              <span class="rv-item-score">${r.rating}/5</span>
            </div>
          </div>
          <p class="rv-item-msg">${r.msg}</p>
          ${cardPhotos(r.photos)}
        </article>
      `;
    }).join("");

    calcStats();
  };

  const seed = () => {
    const fake = [
      { name: "Hà My", rating: 5, dish: "Mushroom Cream Soup", msg: "Không gian tối giản, phục vụ nhanh. Súp nấm rất thơm, vị vừa miệng.", photos: [] },
      { name: "Tuấn Anh", rating: 4, dish: "Spring Rolls", msg: "Món ăn ổn, cuốn giòn. Giá hợp lý. Nếu nước chấm đậm thêm chút sẽ ngon hơn.", photos: [] },
      { name: "Ngọc Lan", rating: 5, dish: "Steak", msg: "Steak mềm, chín đúng yêu cầu. Nhân viên dễ thương, sẽ quay lại.", photos: [] },
      { name: "Minh Khoa", rating: 4, dish: "", msg: "Menu đa dạng, set món lên nhanh. Cuối tuần hơi đông nên chờ một chút.", photos: [] },
      { name: "An Nhiên", rating: 3, dish: "Bruschetta", msg: "Ổn, nhưng mình thích bánh giòn hơn. Tổng thể vẫn ok.", photos: [] }
    ];

    const now = new Date();
    state.reviews = fake.map((r, i) => ({
      ...r,
      time: formatTime(new Date(now.getTime() - (i + 1) * 8640000)),
      photos: r.photos
    }));
    renderList();
  };

  const getFormData = () => {
    const name = (el.name.value || "").trim();
    const dish = (el.dish.value || "").trim();
    const msg = (el.msg.value || "").trim();
    const rating = Number(el.rating.value || 0);

    return { name, dish, msg, rating };
  };

  const validate = () => {
    const d = getFormData();
    if (!d.name) return { ok: false, field: el.name, msg: "Vui lòng nhập họ tên." };
    if (!d.rating) return { ok: false, field: $("#starPicker"), msg: "Vui lòng chọn số sao." };
    if (!d.msg || d.msg.length < 10) return { ok: false, field: el.msg, msg: "Nhận xét quá ngắn. Nhập thêm chút nhé." };
    return { ok: true, data: d };
  };

  el.fillDemo.addEventListener("click", () => {
    el.name.value = "Minh Trần";
    el.dish.value = "Bruschetta";
    el.visit.value = "repeat";
    el.msg.value = "Món lên nhanh, vị ổn. Không gian tối, hợp đi tối cuối tuần. Mong Dinio thêm 1–2 món chay.";
    setStars(4);
    showToast("Đã điền demo", "Bạn có thể thêm ảnh và bấm gửi (fake).");
  });

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = validate();
    if (!r.ok) {
      showToast("Thiếu thông tin", r.msg);
      r.field && r.field.focus && r.field.focus();
      return;
    }

    const urls = state.files.map((f) => URL.createObjectURL(f));
    const entry = {
      name: r.data.data ? r.data.data.name : r.data.name,
      rating: r.data.data ? r.data.data.rating : r.data.rating,
      dish: r.data.data ? r.data.data.dish : r.data.dish,
      msg: r.data.data ? r.data.data.msg : r.data.msg,
      time: formatTime(new Date()),
      photos: urls
    };

    state.reviews = [entry, ...state.reviews];
    renderList();

    el.mode.textContent = "Đã ghi nhận";
    showToast("Đã gửi (demo)", "Cảm ơn bạn! Review đã được thêm vào danh sách (fake).");

    el.form.reset();
    setStars(0);
    state.files = [];
    renderPhotoGrid();
    window.setTimeout(() => (el.mode.textContent = "Fake mode"), 1600);
  });

  el.filter.addEventListener("change", renderList);

  el.resetFilter.addEventListener("click", () => {
    el.filter.value = "all";
    renderList();
  });

  el.toastClose.addEventListener("click", () => el.toast.classList.add("is-hidden"));

  const renderGallery = () => {
    el.gallery.innerHTML = "";
    const n = 6;
    for (let i = 0; i < n; i++) {
      const node = document.createElement("div");
      node.className = "rv-g";
      el.gallery.appendChild(node);
    }
  };

  el.shuffle.addEventListener("click", () => {
    renderGallery();
    showToast("Đã đổi ảnh", "Gallery placeholder đã refresh.");
  });

  seed();
  renderGallery();
});
