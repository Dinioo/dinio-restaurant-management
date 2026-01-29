document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("auditSearch");
  const rows = Array.from(document.querySelectorAll(".audit-row"));
  const empty = document.getElementById("auditEmpty");

  if (!rows.length || !search) return;

  function applyFilter() {
    const q = (search.value || "").trim().toLowerCase();
    let shown = 0;

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      const ok = q ? text.includes(q) : true;
      row.style.display = ok ? "" : "none";
      if (ok) shown++;
    });

    if (empty) empty.style.display = shown ? "none" : "";
  }

  search.addEventListener("input", applyFilter);
});
