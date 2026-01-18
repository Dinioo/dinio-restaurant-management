const $ = (s) => document.querySelector(s);

function formatDateTime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function isValidPhone(v) {
  return /^[0-9\s()+-]{8,20}$/.test(String(v || "").trim());
}

function isValidEmail(v) {
  const s = String(v || "").trim();
  return s.includes("@") && s.includes(".");
}

function setRightHead(key) {
  const rightTitle = $("#rightTitle");
  const rightSub = $("#rightSub");
  if (!rightTitle || !rightSub) return;

  if (key === "profile") {
    rightTitle.textContent = "Cập nhật thông tin";
    rightSub.textContent = "Các trường cơ bản";
  } else if (key === "email") {
    rightTitle.textContent = "Đổi email";
    rightSub.textContent = "Yêu cầu xác thực mật khẩu";
  } else if (key === "password") {
    rightTitle.textContent = "Đổi mật khẩu";
    rightSub.textContent = "Tối thiểu 8 ký tự";
  }
}

function switchPanel(key) {
  document.querySelectorAll(".profile-pill").forEach((x) => x.classList.remove("is-active"));
  document.querySelectorAll(".profile-panel").forEach((p) => p.classList.remove("is-active"));

  const pill = document.querySelector(`.profile-pill[data-tab="${key}"]`);
  const panel = document.getElementById(`panel-${key}`);

  if (pill) pill.classList.add("is-active");
  if (panel) panel.classList.add("is-active");

  setRightHead(key);
}

const user = {
  code: "DN-01982",
  points: 1280,
  joinDate: "12/10/2024",
  tier: "Premium Member",
  fullName: "Nguyễn Văn A",
  phone: "0901 234 567",
  email: "nguyenvana@gmail.com",
  dob: "2001-01-01",
  gender: "male",
  address: "123 Nguyễn Huệ, Q.1, TP.HCM",
  note: "Thích bàn gần cửa sổ.",
  avatarUrl: $("#avatarImg") ? $("#avatarImg").src : "",
  updatedAt: null,
};

function loadToUI() {
  const sumName = $("#sumName");
  const sumPhone = $("#sumPhone");
  const sumEmail = $("#sumEmail");
  const sumTier = $("#sumTier");
  const sumCode = $("#sumCode");
  const sumPoint = $("#sumPoint");
  const sumJoin = $("#sumJoin");
  const avatarImg = $("#avatarImg");

  if (sumName) sumName.textContent = user.fullName;
  if (sumPhone) sumPhone.textContent = `SĐT: ${user.phone}`;
  if (sumEmail) sumEmail.textContent = `Email: ${user.email}`;
  if (sumTier) sumTier.textContent = user.tier;

  if (sumCode) sumCode.textContent = user.code;
  if (sumPoint) sumPoint.textContent = Number(user.points || 0).toLocaleString("vi-VN");
  if (sumJoin) sumJoin.textContent = user.joinDate;

  if (avatarImg && user.avatarUrl) avatarImg.src = user.avatarUrl;

  const fullName = $("#fullName");
  const phone = $("#phone");
  const dob = $("#dob");
  const gender = $("#gender");
  const address = $("#address");
  const note = $("#note");
  const currentEmail = $("#currentEmail");

  if (fullName) fullName.value = user.fullName || "";
  if (phone) phone.value = user.phone || "";
  if (dob) dob.value = user.dob || "";
  if (gender) gender.value = user.gender || "";
  if (address) address.value = user.address || "";
  if (note) note.value = user.note || "";
  if (currentEmail) currentEmail.value = user.email || "";

  const lastUpdated = $("#lastUpdated");
  if (lastUpdated) {
    lastUpdated.textContent = user.updatedAt ? `Cập nhật lần cuối: ${user.updatedAt}` : "Cập nhật lần cuối: —";
  }
}

function logout() {
  infoToast("Đăng xuất thành công");
  setTimeout(() => {
    window.location.href = "/login";
  }, 900);
}

function bindTabs() {
  document.querySelectorAll(".profile-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const key = pill.dataset.tab;
      switchPanel(key);
    });
  });
}

function bindAvatar() {
  const btn = $("#btnChangeAvatar");
  const input = $("#avatarFile");
  if (!btn || !input) return;

  btn.addEventListener("click", () => input.click());

  input.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      errorToast("Vui lòng chọn đúng file ảnh");
      input.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      errorToast("Ảnh quá lớn (tối đa 2MB)");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      user.avatarUrl = reader.result;
      user.updatedAt = formatDateTime(new Date());
      loadToUI();
      successToast("Đã cập nhật ảnh đại diện");
    };
    reader.readAsDataURL(file);
  });
}

function bindForms() {
  const profileForm = $("#profileForm");
  const emailForm = $("#emailForm");
  const passwordForm = $("#passwordForm");

  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fullName = $("#fullName")?.value.trim() || "";
      const phone = $("#phone")?.value.trim() || "";

      if (fullName.length < 2) {
        errorToast("Tên chưa hợp lệ (nhập đầy đủ họ tên)");
        return;
      }
      if (!isValidPhone(phone)) {
        errorToast("SĐT chưa hợp lệ (chỉ dùng số, +, -, ( ), dấu cách)");
        return;
      }

      user.fullName = fullName;
      user.phone = phone;
      user.dob = $("#dob")?.value || "";
      user.gender = $("#gender")?.value || "";
      user.address = $("#address")?.value.trim() || "";
      user.note = $("#note")?.value.trim() || "";
      user.updatedAt = formatDateTime(new Date());

      loadToUI();
      successToast("Thông tin đã được cập nhật");
    });
  }

  if (emailForm) {
    emailForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const newEmail = $("#newEmail")?.value.trim() || "";
      const pwd = $("#emailPassword")?.value || "";

      if (!isValidEmail(newEmail)) {
        errorToast("Email mới chưa hợp lệ");
        return;
      }
      if (pwd.length < 6) {
        errorToast("Mật khẩu hiện tại chưa đúng");
        return;
      }

      user.email = newEmail;
      user.updatedAt = formatDateTime(new Date());

      emailForm.reset();
      loadToUI();
      successToast("Đổi email thành công");
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const oldPwd = $("#oldPassword")?.value || "";
      const newPwd = $("#newPassword")?.value || "";
      const confirm = $("#confirmPassword")?.value || "";

      if (oldPwd.length < 6) {
        errorToast("Mật khẩu hiện tại chưa hợp lệ");
        return;
      }
      if (newPwd.length < 8) {
        errorToast("Mật khẩu mới quá ngắn (tối thiểu 8 ký tự)");
        return;
      }
      if (newPwd !== confirm) {
        errorToast("Xác nhận mật khẩu không khớp");
        return;
      }
      if (newPwd === oldPwd) {
        warningToast("Mật khẩu mới trùng mật khẩu cũ");
        return;
      }

      passwordForm.reset();
      user.updatedAt = formatDateTime(new Date());
      loadToUI();
      successToast("Đổi mật khẩu thành công");
    });
  }

  const btnLogout2 = $("#btnLogout2");
  if (btnLogout2) btnLogout2.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", () => {
  bindTabs();
  bindAvatar();
  bindForms();
  loadToUI();
  switchPanel("profile");
});
