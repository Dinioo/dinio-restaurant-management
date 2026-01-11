/* DINIO — TABLE MAP: Mode switch (self/other)
   - Safe init
   - Works with Thymeleaf fragments
*/

(() => {
  // ===== Debug: confirm file loaded =====
  // Xong rồi thì bạn có thể comment 2 dòng log này lại
  console.log("✅ table-map.js loaded");

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const modeWrap = $(".tm-mode");
  if (!modeWrap) {
    console.warn("⚠️ .tm-mode not found → skip mode-switch init");
    return;
  }

  const bookingMode = $("#bookingMode");
  const modeBtns = $$(".tm-mode-btn", modeWrap);
  const panels = $$(".tm-panel[data-panel]");

  if (!modeBtns.length || !panels.length) {
    console.warn("⚠️ modeBtns/panels missing", { modeBtns: modeBtns.length, panels: panels.length });
    return;
  }

  const self = {
    name: $("#fullName"),
    phone: $("#phone"),
    email: $("#email"),
  };

  const other = {
    name: $("#fullName2"),
    phone: $("#phone2"),
    email: $("#email2"),
    guestName: $("#guestName"),
    guestPhone: $("#guestPhone"),
  };

  const setActiveTab = (mode) => {
    modeBtns.forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  const setPanel = (mode) => {
    panels.forEach((p) => {
      p.classList.toggle("is-hidden", p.dataset.panel !== mode);
    });
  };

  const sync = (from, to) => {
    if (from?.name && to?.name) to.name.value = from.name.value || "";
    if (from?.phone && to?.phone) to.phone.value = from.phone.value || "";
    if (from?.email && to?.email) to.email.value = from.email.value || "";
  };

  const setMode = (mode) => {
    if (mode !== "self" && mode !== "other") mode = "self";

    setActiveTab(mode);
    setPanel(mode);

    if (bookingMode) bookingMode.value = mode;

    // Required rules
    if (other.guestName) other.guestName.required = (mode === "other");
    if (other.guestPhone) other.guestPhone.required = false;

    // Sync basic info
    if (mode === "other") sync(self, other);
    else sync(other, self);

    console.log("✅ mode set:", mode);
  };

  // Click switch
  modeWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".tm-mode-btn");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  // Init from hidden input (if present)
  const initial = bookingMode?.value || "self";
  setMode(initial);
})();
