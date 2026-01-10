(() => {
  const modeWrap = document.querySelector(".tm-mode");
  if (!modeWrap) return;

  const bookingMode = document.getElementById("bookingMode");
  const modeBtns = [...modeWrap.querySelectorAll(".tm-mode-btn")];
  const panels = [...document.querySelectorAll(".tm-panel[data-panel]")];

  const self = {
    name: document.getElementById("fullName"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
  };

  const other = {
    name: document.getElementById("fullName2"),
    phone: document.getElementById("phone2"),
    email: document.getElementById("email2"),
    guestName: document.getElementById("guestName"),
    guestPhone: document.getElementById("guestPhone"),
  };

  const setActiveTab = (mode) => {
    modeBtns.forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  const setPanel = (mode) => {
    panels.forEach((p) => p.classList.toggle("is-hidden", p.dataset.panel !== mode));
  };

  const sync = (from, to) => {
    if (from.name && to.name) to.name.value = from.name.value || "";
    if (from.phone && to.phone) to.phone.value = from.phone.value || "";
    if (from.email && to.email) to.email.value = from.email.value || "";
  };

  const setMode = (mode) => {
    setActiveTab(mode);
    setPanel(mode);

    if (bookingMode) bookingMode.value = mode;

    if (other.guestName) other.guestName.required = (mode === "other");
    if (other.guestPhone) other.guestPhone.required = false;

    if (mode === "other") sync(self, other);
    else sync(other, self);
  };

  modeWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".tm-mode-btn");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  setMode("self");
})();
