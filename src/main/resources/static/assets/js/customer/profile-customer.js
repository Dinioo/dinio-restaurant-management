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
}

function bindForms() {
  $("#profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch('/dinio/profile/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
});