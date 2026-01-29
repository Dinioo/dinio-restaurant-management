document.addEventListener("DOMContentLoaded", () => {
    const host = document.getElementById("toastHost");
    const table = document.getElementById("staffTable");
    const empty = document.getElementById("staffEmpty");
    const search = document.getElementById("staffSearch");
    const roleFilter = document.getElementById("roleFilter");

    const getHeaders = () => {
        const token = document.querySelector('meta[name="_csrf"]')?.content;
        const header = document.querySelector('meta[name="_csrf_header"]')?.content;
        const headers = { "Content-Type": "application/json" };
        if (token && header) headers[header] = token;
        return headers;
    };

    function toast(msg, type = "success") {
        if (!host) return;
        const el = document.createElement("div");
        el.className = `toast ${type}`;

        const icon =
            type === "success" ? "fa-circle-check" :
                type === "error" ? "fa-circle-xmark" :
                    "fa-triangle-exclamation";

        el.innerHTML = `
      <i class="fa-solid ${icon} t-ic"></i>
      <div class="t-msg">${escapeHtml(msg)}</div>
    `;
        host.appendChild(el);
        setTimeout(() => el.remove(), 2500);
    }

    function escapeHtml(s) {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function applyFilter() {
        const q = (search?.value || "").trim().toLowerCase();
        const role = (roleFilter?.value || "all").trim().toLowerCase();
        const rows = Array.from(document.querySelectorAll(".staff-row"));

        let shown = 0;

        rows.forEach(r => {
            const u = (r.dataset.username || "").toLowerCase();
            const ro = (r.dataset.role || "").toLowerCase();

            const okQ = q ? u.includes(q) : true;
            const okRole = role === "all" ? true : ro === role;

            const ok = okQ && okRole;
            r.style.display = ok ? "" : "none";
            if (ok) shown += 1;
        });

        if (empty) empty.classList.toggle("is-hidden", shown !== 0);
    }

    search?.addEventListener("input", applyFilter);
    roleFilter?.addEventListener("change", applyFilter);

    // Confirm delete
    table?.addEventListener("submit", (e) => {
        const form = e.target.closest(".del-form");
        if (!form) return;

        const row = form.closest(".staff-row");
        const username = row?.dataset.username || "staff này";

        const ok = window.confirm(`Xóa ${username}? Hành động này không thể hoàn tác.`);
        if (!ok) e.preventDefault();
    });

    // Inline edit
    table?.addEventListener("click", async (e) => {
        const row = e.target.closest(".staff-row");
        if (!row) return;

        const id = row.dataset.id;

        const btnEdit = e.target.closest(".btn-edit");
        const uView = row.querySelector(".username-view");
        const uInput = row.querySelector(".username-input");

        if (!btnEdit) return;

        row.classList.add("is-editing");
        uInput.value = row.dataset.username || "";
        uInput.focus();

        uInput.addEventListener("keydown", async (ev) => {
            if (ev.key === "Escape") {
                row.classList.remove("is-editing");
                uInput.value = row.dataset.username || "";
                return;
            }

            if (ev.key === "Enter") {
                ev.preventDefault();
                const username = uInput.value.trim();
                if (!username) {
                    toast("Username không được trống", "warn");
                    return;
                }

                try {
                    const res = await fetch("/dinio/admin/staff/update-username", {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify({ id: Number(id), username })
                    });

                    if (!res.ok) {
                        toast(await res.text(), "error");
                        return;
                    }

                    const data = await res.json();
                    if (data.status !== "success") {
                        toast(data.message || "Update thất bại", "error");
                        return;
                    }

                    row.dataset.username = username;
                    uView.textContent = username;
                    row.classList.remove("is-editing");
                    toast("Đã cập nhật username", "success");
                    applyFilter();
                } catch {
                    toast("Lỗi hệ thống", "error");
                }
            }
        }, { once: true });
    });

    applyFilter();
});
