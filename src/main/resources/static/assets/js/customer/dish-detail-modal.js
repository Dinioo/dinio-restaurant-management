document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("dishModal");
    if (!modal) 
        return;

    const mediaEl = document.getElementById("dishModalMedia");
    const infoEl = document.getElementById("dishModalInfo");

    const imgEl = document.getElementById("dishModalImg");
    const badgeEl = document.getElementById("dishModalBadge");
    const nameEl = document.getElementById("dishModalName");
    const descEl = document.getElementById("dishModalDesc");
    const priceEl = document.getElementById("dishModalPrice");
    const orderBtn = document.getElementById("dishOrderNowBtn");

    let isOpen = false;

    const open = (data) => {
        imgEl.src = data.img || "";
        imgEl.alt = data.title || "Dish";
        badgeEl.textContent = data.badge || "";
        nameEl.textContent = data.title || "";
        descEl.textContent = data.desc || "";
        priceEl.textContent = data.price || "";

        modal.classList.remove("is-hidden");
        modal.setAttribute("aria-hidden", "false");
        isOpen = true;

        requestAnimationFrame(() => {
            syncMediaHeight();
            orderBtn?.focus();
        });
    };

    const close = () => {
        modal.classList.add("is-hidden");
        modal.setAttribute("aria-hidden", "true");
        isOpen = false;

        if (mediaEl) mediaEl.style.height = "";
    };

    const syncMediaHeight = () => {
        if (!isOpen) 
            return;
        if (!mediaEl || !infoEl) 
            return;

        const isMobile = window.matchMedia("(max-width: 820px)").matches;
        if (isMobile) 
            return;

        const h = infoEl.offsetHeight;

        mediaEl.style.height = `${h}px`;
    };

    modal.addEventListener("click", (e) => {
        if (e.target?.dataset?.close) close();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("is-hidden")) close();
    });

    window.addEventListener("resize", () => {
        if (isOpen) syncMediaHeight();
    });

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".js-dish-detail");
        if (!btn) 
            return;

        e.preventDefault();

        const card = btn.closest(".dish-card");
        if (!card) 
            return;

        const data = {
            title: card.dataset.title,
            desc: card.dataset.desc,
            price: card.dataset.price,
            img: card.dataset.img,
            badge: card.dataset.badge
        };

        open(data);
    });

    orderBtn?.addEventListener("click", () => {
        close();

        if (window.openCheckReservationModal) {
            window.openCheckReservationModal();
            return;
        }

        window.location.href = "/dinio/reservation/tables";
    });

});
