const $ = (s) => document.querySelector(s);

const getHeaders = () => {
    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const headers = { 'Content-Type': 'application/json' };
    
    if (token && header) {
      headers[header] = token; 
    }
    return headers;
  };

let userData = {};

async function fetchProfileData() {
  try {
    const res = await fetch('/dinio/profile/api/data');
    if (res.status === 401) 
      return window.location.href = "/dinio/login";
    
    userData = await res.json();
    loadToUI();
  } catch (err) {
    console.error("Lỗi nạp dữ liệu hồ sơ:", err);
  }
}

function loadToUI() {
  if ($("#sumName")) $("#sumName").textContent = userData.fullName;
  if ($("#sumPhone")) $("#sumPhone").textContent = `SĐT: ${userData.phone}`;
  if ($("#sumEmail")) $("#sumEmail").textContent = `Email: ${userData.email}`;
  if ($("#sumCode")) $("#sumCode").textContent = userData.code;
  if ($("#sumPoint")) $("#sumPoint").textContent = userData.points;
  if ($("#sumJoin")) $("#sumJoin").textContent = userData.joinDate;

  if ($("#fullName")) $("#fullName").value = userData.fullName;
  if ($("#phone")) $("#phone").value = userData.phone;
  if ($("#currentEmail")) $("#currentEmail").value = userData.email;
  
  if ($("#dob")) $("#dob").value = (userData.dob === "N/A") ? "" : userData.dob;
  if ($("#address")) $("#address").value = (userData.address === "N/A") ? "" : userData.address;
  if ($("#note")) $("#note").value = (userData.note === "N/A") ? "" : userData.note;
   if ($("#avatarImg")) $("#avatarImg").src = userData.avatarUrl || $("#avatarImg").src;
}

function bindAvatar() {
  const btn = $("#btnChangeAvatar");
  const fileInput = $("#avatarFile");
  const img = $("#avatarImg");

  if (!btn || !fileInput || !img) return;

  btn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      errorToast("File không hợp lệ");
      fileInput.value = "";
      return;
    }

    const oldSrc = img.src;

    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => URL.revokeObjectURL(url);

    btn.disabled = true;
    btn.textContent = "Đang tải...";

    try {
      const fd = new FormData();
      fd.append("avatarFile", file);

      const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
      const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

      const headers = {};
      if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;

      const res = await fetch("/dinio/profile/api/avatar", {
        method: "POST",
        headers,
        body: fd
      });

      if (!res.ok) {
        const msg = await res.text();
        img.src = oldSrc;
        errorToast(msg || "Upload ảnh thất bại");
        return;
      }

      const data = await res.json();
      if (data?.avatarUrl) {
        img.src = data.avatarUrl;
        userData.avatarUrl = data.avatarUrl;
      }

      successToast("Đổi ảnh thành công");
      fileInput.value = "";
    } catch (e) {
      img.src = oldSrc;
      errorToast("Upload ảnh thất bại");
    } finally {
      btn.disabled = false;
      btn.textContent = "Đổi ảnh";
    }
  });
}


function bindForms() {
  $("#profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch('/dinio/profile/api/update', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fullName: $("#fullName").value,
        phone: $("#phone").value
      })
    });
    if (res.ok) { 
      successToast("Đã cập nhật hồ sơ"); 
      fetchProfileData(); 
    }
  });

  $("#emailForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch('/dinio/profile/api/change-email', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        newEmail: $("#newEmail").value,
        password: $("#emailPassword").value
      })
    });
    if (res.ok) { 
      successToast("Đổi email thành công"); 
      e.target.reset(); 
      fetchProfileData(); 
    } else { 
      errorToast(await res.text()); 
    }
  });

  $("#passwordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPwd = $("#oldPassword").value;
    const newPwd = $("#newPassword").value;
    const confirm = $("#confirmPassword").value;

    if (newPwd !== confirm) 
      return errorToast("Mật khẩu xác nhận không khớp");

    const res = await fetch('/dinio/profile/api/change-password', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ oldPwd, newPwd })
    });
    
    if (res.ok) { 
      successToast("Đổi mật khẩu thành công"); 
      e.target.reset(); 
    } else { 
      errorToast(await res.text()); 
    }
  });
}

function bindTabs() {
  document.querySelectorAll(".profile-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const key = pill.dataset.tab;
      document.querySelectorAll(".profile-pill").forEach((x) => x.classList.remove("is-active"));
      document.querySelectorAll(".profile-panel").forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      document.getElementById(`panel-${key}`)?.classList.add("is-active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProfileData();
  bindTabs();
  bindForms();
  bindAvatar();
});