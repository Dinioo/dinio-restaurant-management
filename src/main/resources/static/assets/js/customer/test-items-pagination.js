(() => {
  const ITEMS_PER_PAGE = 8;
  let currentPage = 1;
  let totalPages = 1;

  // Wait for DOM to be fully loaded
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".best-grid");
    if (!container) return;

    const allItems = Array.from(container.children);
    if (allItems.length === 0) return;

    totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

    // Only create pagination if more than ITEMS_PER_PAGE items
    if (allItems.length > ITEMS_PER_PAGE) {
      createPagination();
      showPage(1);
    }
  });

  function showPage(page) {
    const container = document.querySelector(".best-grid");
    if (!container) return;

    const allItems = Array.from(container.children);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    allItems.forEach((item, index) => {
      if (index >= startIndex && index < endIndex) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });

    currentPage = page;
    updateDots();

    // Smooth scroll to section
    const section = document.getElementById("best-seller");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function createPagination() {
    const section = document.getElementById("best-seller");
    if (!section) return;

    // Create dots navigation container
    const dotsNav = document.createElement("div");
    dotsNav.className = "dots-navigation";
    dotsNav.style.marginTop = "32px";

    for (let i = 1; i <= totalPages; i++) {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.setAttribute("aria-label", `Page ${i}`);
      dot.dataset.page = i;

      dot.addEventListener("click", () => {
        showPage(i);
      });

      dotsNav.appendChild(dot);
    }

    section.appendChild(dotsNav);
  }

  function updateDots() {
    const dots = document.querySelectorAll(".dot");
    dots.forEach((dot, index) => {
      if (index + 1 === currentPage) {
        dot.classList.add("is-active");
      } else {
        dot.classList.remove("is-active");
      }
    });
  }
})();
