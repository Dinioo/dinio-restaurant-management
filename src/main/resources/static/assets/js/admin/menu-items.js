(() => {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.initMenuPage !== "function") 
      return;
    window.initMenuPage({ view: "admin" });
  });
})();
