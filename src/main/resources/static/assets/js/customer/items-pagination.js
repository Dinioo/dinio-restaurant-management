(() => {
  const ITEMS_PER_PAGE = 8;
  const CONTEXT_PATH = '/dinio'; 
  let currentPage = 1;
  let totalPages = 1;

  document.addEventListener("DOMContentLoaded", () => {
    loadFavoriteItems();
    setupModalCloseHandlers();
  });

  function resolveImageUrl(imgUrl) {
    if (!imgUrl) 
      return `${CONTEXT_PATH}/assets/pic/default-food.png`;
    
    if (imgUrl.startsWith('http')) 
      return imgUrl;

    const fileName = imgUrl.split('/').pop();
    return `${CONTEXT_PATH}/assets/pic/${fileName}`;
  }

  window.handleImageError = function(img) {
      img.onerror = null; 
      img.src = `${CONTEXT_PATH}/assets/pic/default-food.png`; 
  };

  window.openDishModal = async function(id) {
    try {
        const response = await fetch(`${CONTEXT_PATH}/api/menu/items/${id}`);
        if (!response.ok) throw new Error(`Lỗi tải: ${response.status}`);
        const itemDetail = await response.json();
        populateAndShowModal(itemDetail);
    } catch (error) {
        console.error("Lỗi API chi tiết:", error);
        alert("Không thể tải thông tin món ăn này.");
    }
  };

  function populateAndShowModal(item) {
    const modal = document.getElementById('dishModal');
    if (!modal)
      return;

    const imgEl = document.getElementById('dishModalImg');
    const badgeEl = document.getElementById('dishModalBadge');
    const nameEl = document.getElementById('dishModalName');
    const descEl = document.getElementById('dishModalDesc');
    const priceEl = document.getElementById('dishModalPrice');
    const btnOrder = document.getElementById('dishOrderNowBtn');

    const priceFormatted = typeof item.price === 'string' ? item.price : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price || 0);
    const imageUrl = resolveImageUrl(item.imageUrl);

    let badgeText = '';
    if (item.itemTags && item.itemTags.length > 0) {
        badgeText = item.itemTags[0];
    }

    if(imgEl) {
        imgEl.src = imageUrl;
        imgEl.onerror = function() { this.src = `${CONTEXT_PATH}/assets/pic/default-food.png`; };
    }
    
    if(badgeEl) {
        badgeEl.textContent = badgeText;
        badgeEl.style.display = badgeText ? 'inline-block' : 'none';
    }

    if(nameEl) nameEl.textContent = item.name;
    if(descEl) descEl.textContent = item.description || '';
    if(priceEl) priceEl.textContent = priceFormatted;

    if(btnOrder) {
        btnOrder.onclick = function() {
            window.location.href = `${CONTEXT_PATH}/reservation?dish=${item.id}`;
        };
    }

    modal.classList.remove('is-hidden');
    modal.classList.add('is-active'); 
    document.body.style.overflow = 'hidden'; 
  }

  function setupModalCloseHandlers() {
    const modal = document.getElementById('dishModal');
    if (!modal) 
      return;
    modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close="1"]')) {
            closeModal(modal);
        }
    });
  }

  function closeModal(modal) {
      modal.classList.add('is-hidden');
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
  }

  async function loadFavoriteItems() {
    const container = document.querySelector(".best-grid");
    if (!container) 
      return;

    try {
      const response = await fetch(`${CONTEXT_PATH}/api/menu/favorites`);
      
      if (!response.ok) throw new Error(`Network response not ok: ${response.status}`);
      
      const allItemsData = await response.json();

      container.innerHTML = '';

      if (!allItemsData || allItemsData.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1/-1;">Không có món nào được đề xuất.</p>';
        return;
      }

      allItemsData.forEach(item => {
        const itemHtml = createDishCardHtml(item);
        container.insertAdjacentHTML('beforeend', itemHtml);
      });

      const itemElements = Array.from(container.children);
      totalPages = Math.ceil(itemElements.length / ITEMS_PER_PAGE);

      createPagination();
      showPage(1);

    } catch (error) {
      console.error("Lỗi tải món ăn yêu thích:", error);
    }
  }

  function createDishCardHtml(item) {
    const priceFormatted = item.price;
    const imageUrl = resolveImageUrl(item.imageUrl);
    
    let badgeText = '';
    let badgeHtml = '';
    if (item.itemTags && item.itemTags.length > 0) {
        badgeText = item.itemTags[0];
        badgeHtml = `<span class="dish-badge">${badgeText}</span>`;
    }

    return `
      <article class="dish-card" 
               data-title="${item.name}"
               data-desc="${item.description || ''}"
               data-price="${priceFormatted}"
               data-img="${imageUrl}"
               data-badge="${badgeText}">
               
        <div class="dish-media">
          <img src="${imageUrl}" alt="${item.name}" loading="lazy" onerror="handleImageError(this)" />
          ${badgeHtml}
        </div>

        <div class="dish-body">
          <h4 class="dish-title">${item.name}</h4>
          <p class="dish-desc">${item.description || ''}</p>

          <div class="dish-foot">
            <span class="dish-price">${priceFormatted}</span>
            <button type="button" 
                    class="btn btn-order js-dish-detail" 
                    onclick="openDishModal(${item.id})">
              Chi tiết
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function showPage(page) {
    const container = document.querySelector(".best-grid");
    if (!container) 
      return;

    const allItems = Array.from(container.children);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    allItems.forEach((item, index) => {
      if (index >= startIndex && index < endIndex) {
        item.style.display = ""; 
        if(getComputedStyle(item).display === 'none') {
             item.style.display = "flex";
        }
      } else {
        item.style.display = "none";
      }
    });

    currentPage = page;
    updateDots();
  }

  function createPagination() {
    let section = document.querySelector("#best-seller .dots-navigation");
        if(!section) {
       const parent = document.getElementById("best-seller");
       if(parent) {
           section = document.createElement("div");
           section.className = "dots-navigation";
           parent.appendChild(section);
       } else 
        return;
    }
    
    section.innerHTML = ''; 

    const dotsContainer = document.createElement("div");
    dotsContainer.style.display = "flex";
    dotsContainer.style.gap = "8px";
    dotsContainer.style.justifyContent = "center";
    dotsContainer.style.marginBottom = "10px"; 

    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
          const dot = document.createElement("button");
          dot.className = "dot";  
          dot.setAttribute("aria-label", `Page ${i}`);
          dot.dataset.page = i;
          dot.addEventListener("click", () => {
            showPage(i);
          });
          dotsContainer.appendChild(dot);
        }
    }
    
    section.appendChild(dotsContainer);

    const seeMoreBtn = document.createElement("a");
    seeMoreBtn.href = `${CONTEXT_PATH}/menu`;
    seeMoreBtn.className = "btn btn-cta";
    seeMoreBtn.textContent = "Xem thêm";
    section.appendChild(seeMoreBtn);
  }

  function updateDots() {
    const dots = document.querySelectorAll(".dots-navigation .dot");
    if(dots.length === 0) 
      return;
    dots.forEach((dot, index) => {
      if (index + 1 === currentPage) {
        dot.classList.add("is-active"); 
        dot.style.opacity = "1";
      } else {
        dot.classList.remove("is-active");
        dot.style.opacity = "0.5";
      }
    });
  }
})();