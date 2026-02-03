document.addEventListener("DOMContentLoaded", () => {
  const $ = (q, p = document) => p.querySelector(q);
  const $$ = (q, p = document) => Array.from(p.querySelectorAll(q));

  const el = {
    form: $("#contactForm"),
    status: $("#ctStatus"),
    fill: $("#ctFillDemo"),
    toast: $("#ctToast"),
    toastClose: $("#toastClose"),
    toastTitle: $("#toastTitle"),
    toastSub: $("#toastSub"),
    copyAddr: $("#ctCopyAddr"),
    openMap: $("#ctOpenMap"),
    name: $("#ctName"),
    phone: $("#ctPhone"),
    email: $("#ctEmail"),
    topic: $("#ctTopic"),
    time: $("#ctTime"),
    guests: $("#ctGuests"),
    msg: $("#ctMsg")
  };

  const showToast = (title, sub) => {
    el.toastTitle.textContent = title;
    el.toastSub.textContent = sub;
    el.toast.classList.remove("is-hidden");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => el.toast.classList.add("is-hidden"), 3200);
  };

  const normalizePhone = (s) => (s || "").replace(/[^\d+]/g, "").trim();

  const validate = () => {
    const name = (el.name.value || "").trim();
    const phone = normalizePhone(el.phone.value);
    const topic = (el.topic.value || "").trim();
    const msg = (el.msg.value || "").trim();

    if (!name) 
      return { ok: false, field: el.name, msg: "Vui lòng nhập họ tên." };
    if (!phone || phone.length < 9) 
      return { ok: false, field: el.phone, msg: "Vui lòng nhập số điện thoại hợp lệ." };
    if (!topic) 
      return { ok: false, field: el.topic, msg: "Vui lòng chọn chủ đề." };
    if (!msg || msg.length < 10) 
      return { ok: false, field: el.msg, msg: "Nội dung quá ngắn. Nhập thêm chút nhé." };
    return { ok: true };
  };

  el.fill.addEventListener("click", () => {
    el.name.value = "Minh Trần";
    el.phone.value = "0909 123 456";
    el.email.value = "minh@demo.fake";
    el.topic.value = "reservation";
    el.time.value = "19:00, Thứ 6";
    el.guests.value = "4";
    el.msg.value = "Mình muốn đặt bàn gần cửa sổ, không hút thuốc. Nếu còn chỗ, xin giúp mình giữ bàn lúc 19:00. Cảm ơn Dinio!";
    showToast("Đã điền demo", "Bạn có thể bấm Gửi để xem hiệu ứng (fake).");
  });

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = validate();
    if (!r.ok) {
      showToast("Thiếu thông tin", r.msg);
      r.field && r.field.focus && r.field.focus();
      return;
    }

    el.status.textContent = "Đã ghi nhận";
    showToast("Đã gửi (demo)", "Tin nhắn đã được ghi nhận. Thực tế bạn sẽ nối API sau.");
    el.form.reset();
    window.setTimeout(() => (el.status.textContent = "Fake mode"), 1800);
  });

  el.toastClose.addEventListener("click", () => el.toast.classList.add("is-hidden"));

  const addr = "123 Nguyễn Huệ, Q1, TP.HCM";

  el.copyAddr.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(addr);
      showToast("Đã copy", "Địa chỉ đã được copy vào clipboard.");
    } catch {
      showToast("Không copy được", "Trình duyệt chặn clipboard. Bạn copy thủ công nhé.");
    }
  });

  el.openMap.addEventListener("click", () => {
    showToast("Map placeholder", "Chưa nhúng map thật. Khi cần iframe Google Map mình chỉnh cho.");
  });

  $$("[data-faq]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-faq");
      const ans = document.querySelector(`[data-faqa="${id}"]`);
      const isOpen = btn.classList.toggle("is-open");
      if (ans) 
        ans.classList.toggle("is-open", isOpen);
    });
  });
});
