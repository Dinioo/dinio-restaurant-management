(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const pvName = $("#pvName");
  const pvDesc = $("#pvDesc");
  const pvPrice = $("#pvPrice");
  const pvCategory = $("#pvCategory");
  const pvImage = $("#pvImage");
  const pvImagePath = $("#pvImagePath");
  const pvTags = $("#pvTags");
  const pvBadge = $("#pvBadge");
  const pvIngredients = $("#pvIngredients");
  const pvAllergens = $("#pvAllergens");

  const pvSumName = $("#pvSumName");
  const pvSumCategory = $("#pvSumCategory");
  const pvSumPrice = $("#pvSumPrice");
  const pvSumStatus = $("#pvSumStatus");

  const form = $("#dishForm");
  const ipName = $("#name");
  const ipDesc = $("#description");
  const ipPrice = $("#price");
  const ipIngredients = $("#ingredients");
  const ipImageFile = $("#imageFile");
  const ipCategory = $("#category"); 
  const ipStatus = $("#status");     

  const tagChecks = $$('input[name="tags"]');
  const allergenChecks = $$('input[name="allergens"]');

  const btnPreviewPopup = $("#btnPreviewPopup");
  const btnResetForm = $("#btnResetForm");
  const btnCopySummary = $("#btnCopySummary");

  const previewModal = $("#previewModal");
  const modalPreviewSlot = $("#modalPreviewSlot");
  const closePreviewModal = $("#closePreviewModal");

  const checklist = $("#pvChecklist");

  const formatVND = (n) => {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) 
      return "0đ";
    return num.toLocaleString("vi-VN") + "đ";
  };

  const splitCommaList = (text) => {
    return (text || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const setList = (ul, items, emptyText) => {
    if (!ul) 
      return;
    ul.innerHTML = "";
    if (!items.length) {
      const li = document.createElement("li");
      li.className = "is-muted";
      li.textContent = emptyText;
      ul.appendChild(li);
      return;
    }
    items.forEach((it) => {
      const li = document.createElement("li");
      li.textContent = it;
      ul.appendChild(li);
    });
  };

  const setTags = () => {
    if (!pvTags) 
      return;
    pvTags.innerHTML = "";
    const selected = tagChecks.filter((i) => i.checked).map((i) => i.value);

    selected.forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      pvTags.appendChild(span);
    });

    if (pvBadge) pvBadge.classList.toggle("is-hidden", !selected.includes("new"));
  };

  const updateImagePreview = () => {
    if (!pvImage) 
      return;

    const file = ipImageFile?.files?.[0];
    if (!file) {
      pvImage.src = "/assets/pic/preview.jpeg";
      if (pvImagePath) pvImagePath.textContent = "preview.jpeg";
      return;
    }

    const url = URL.createObjectURL(file);
    pvImage.src = url;
    pvImage.onload = () => URL.revokeObjectURL(url);
    if (pvImagePath) pvImagePath.textContent = file.name;
  };

  const updateCategoryPreview = () => {
    if (!pvCategory) 
      return;
    const opt = ipCategory?.selectedOptions?.[0];
    const text = opt?.textContent?.trim() || "danh mục";
    pvCategory.textContent = text;
  };

  const updateSummary = () => {
    if (pvSumName) pvSumName.textContent = ipName?.value?.trim() || "—";
    if (pvSumCategory) pvSumCategory.textContent = ipCategory?.selectedOptions?.[0]?.textContent?.trim() || "—";
    if (pvSumPrice) pvSumPrice.textContent = formatVND(ipPrice?.value || 0);
    if (pvSumStatus) pvSumStatus.textContent = ipStatus?.value || "—";
  };

  const setDone = (key, done) => {
    if (!checklist) 
      return;
    const li = checklist.querySelector(`li[data-key="${key}"]`);
    if (!li) 
      return;

    li.classList.toggle("is-done", !!done);
    const icon = li.querySelector("i");
    if (icon) icon.className = done ? "fa-solid fa-circle-check" : "fa-regular fa-circle";
  };

  const updateChecklist = () => {
    setDone("name", !!ipName?.value?.trim());
    setDone("price", !!ipPrice?.value && Number(ipPrice.value) > 0);
    setDone("category", !!ipCategory?.value);
    setDone("ingredients", !!ipIngredients?.value?.trim());
    setDone("image", !!ipImageFile?.files?.length);
  };

  const updateAll = () => {
    if (pvName) pvName.textContent = ipName?.value?.trim() || "Tên món…";
    if (pvDesc) pvDesc.textContent = ipDesc?.value?.trim() || "Mô tả ngắn sẽ hiển thị ở đây…";
    if (pvPrice) pvPrice.textContent = formatVND(ipPrice?.value || 0);

    updateCategoryPreview();
    updateImagePreview();

    const ing = splitCommaList(ipIngredients?.value || "");
    setList(pvIngredients, ing, "Chưa có nguyên liệu");

    const alls = allergenChecks
      .filter((i) => i.checked)
      .map((i) => i.nextElementSibling?.textContent?.trim() || i.value);
    setList(pvAllergens, alls, "Chưa có cảnh báo");

    setTags();
    updateSummary();
    updateChecklist();
  };

  const openModal = () => {
    if (!previewModal) 
      return;
    previewModal.classList.remove("is-hidden");
    previewModal.setAttribute("aria-hidden", "false");

    const previewCard = document.querySelector(".preview-card");
    modalPreviewSlot.innerHTML = "";
    if (previewCard) modalPreviewSlot.appendChild(previewCard.cloneNode(true));
  };

  const closeModal = () => {
    if (!previewModal) 
      return;
    previewModal.classList.add("is-hidden");
    previewModal.setAttribute("aria-hidden", "true");
    modalPreviewSlot.innerHTML = "";
  };

  const resetForm = () => {
    if (!form) 
      return;
    form.reset();
    updateAll();
  };

  const copySummary = async () => {
    const text = [
      `Name: ${ipName?.value?.trim() || "-"}`,
      `Category: ${ipCategory?.selectedOptions?.[0]?.textContent?.trim() || "-"}`,
      `Price: ${ipPrice?.value || "-"}`,
      `Ingredients: ${ipIngredients?.value?.trim() || "-"}`,
      `Status: ${ipStatus?.value || "-"}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      alert("Đã copy tóm tắt món!");
    } catch {
      alert("Không copy được (trình duyệt chặn quyền clipboard).");
    }
  };

  ["input", "change"].forEach((ev) => {
    document.addEventListener(ev, (e) => {
      if (!form) 
        return;
      if (e.target && form.contains(e.target)) updateAll();
    });
  });

  btnPreviewPopup?.addEventListener("click", openModal);
  closePreviewModal?.addEventListener("click", closeModal);
  previewModal?.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  btnResetForm?.addEventListener("click", resetForm);
  btnCopySummary?.addEventListener("click", copySummary);

  updateAll();
})();
