document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s))

  const elAreas = $("#tmAreas")
  const elList = $("#wtmList")
  const elFloor = $("#wtFloor")
  const elShow = $("#wtShow")
  const btnRefresh = $("#btnRefresh")
  const btnClear = $("#btnClearPick")
  const btnOpenBill = $("#btnOpenBill")
  const btnPay = $("#btnPay")

  const pickTable = $("#pickTable")
  const pickArea = $("#pickArea")
  const pickSeats = $("#pickSeats")
  const pickStatus = $("#pickStatus")
  const pickGuest = $("#pickGuest")
  const pickTotal = $("#pickTotal")

  const mockTpl = $("#mockData")
  let tables = []
  let selectedId = null

  const AREA_META = {
    floor1: { title: "Tầng 1", sub: "Khu vực chung" },
    floor2: { title: "Tầng 2", sub: "Khu vực chung" },
    floor3: { title: "Tầng 3", sub: "Khu vực chung" },
    vip: { title: "VIP", sub: "Phòng riêng" },
    outdoor: { title: "Outdoor", sub: "Ngoài trời" }
  }

  const STATUS_META = {
    UNPAID: { label: "Chưa thanh toán", cls: "is-unpaid", badge: "is-unpaid" },
    PENDING: { label: "Đang đợi thanh toán", cls: "is-pending", badge: "is-pending" },
    PAID: { label: "Đã thanh toán", cls: "is-paid", badge: "is-paid" }
  }

  const DEFAULT_DATA = [
    { id: "t01", code: "Bàn 01", seats: 2, area: "floor1", billStatus: "UNPAID", guestCount: 2, billTotal: 180000, seatedAt: "2026-01-30T03:55:00" },
    { id: "t02", code: "Bàn 02", seats: 4, area: "floor1", billStatus: "PENDING", guestCount: 4, billTotal: 520000, seatedAt: "2026-01-30T03:10:00" },
    { id: "t03", code: "Bàn 03", seats: 6, area: "floor1", billStatus: "PAID", guestCount: 5, billTotal: 890000, seatedAt: "2026-01-30T01:40:00" },

    { id: "t11", code: "Bàn 11", seats: 2, area: "floor2", billStatus: "UNPAID", guestCount: 2, billTotal: 260000, seatedAt: "2026-01-30T04:05:00" },
    { id: "t12", code: "Bàn 12", seats: 4, area: "floor2", billStatus: "PENDING", guestCount: 3, billTotal: 410000, seatedAt: "2026-01-30T03:25:00" },
    { id: "t13", code: "Bàn 13", seats: 6, area: "floor2", billStatus: "PAID", guestCount: 6, billTotal: 1200000, seatedAt: "2026-01-30T00:50:00" },

    { id: "t21", code: "Bàn 21", seats: 4, area: "floor3", billStatus: "UNPAID", guestCount: 4, billTotal: 640000, seatedAt: "2026-01-30T03:35:00" },
    { id: "t22", code: "Bàn 22", seats: 2, area: "floor3", billStatus: "PAID", guestCount: 2, billTotal: 220000, seatedAt: "2026-01-30T02:05:00" },

    { id: "v01", code: "VIP 01", seats: 8, area: "vip", billStatus: "PENDING", guestCount: 7, billTotal: 2450000, seatedAt: "2026-01-30T02:45:00" },
    { id: "o01", code: "OUT 01", seats: 4, area: "outdoor", billStatus: "UNPAID", guestCount: 3, billTotal: 360000, seatedAt: "2026-01-30T04:20:00" }
  ]

  const fmtVnd = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ"

  const toMinutes = (iso) => {
    if (!iso) return null
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return null
    return Math.max(0, Math.floor((Date.now() - t) / 60000))
  }

  const statusMeta = (st) => STATUS_META[String(st || "UNPAID").toUpperCase()] || STATUS_META.UNPAID

  const readMock = () => {
    if (!mockTpl) return null
    try {
      const txt = (mockTpl.textContent || "").trim()
      if (!txt) return null
      const arr = JSON.parse(txt)
      if (!Array.isArray(arr)) return null
      return arr.map((t) => ({
        id: String(t.id),
        code: String(t.code),
        seats: Number(t.seats || 0),
        area: String(t.area || "floor1"),
        billStatus: String(t.billStatus || "UNPAID").toUpperCase(),
        guestCount: Number(t.guestCount || 0),
        billTotal: Number(t.billTotal || 0),
        seatedAt: t.seatedAt || null
      }))
    } catch {
      return null
    }
  }

  const groupByArea = (list) => {
    const g = {}
    for (const t of list) {
      const k = AREA_META[t.area] ? t.area : "floor1"
      if (!g[k]) g[k] = []
      g[k].push(t)
    }
    const order = ["floor1", "floor2", "floor3", "vip", "outdoor"]
    return order.filter((k) => g[k]?.length).map((k) => [k, g[k]])
  }

  const clearSelectedUI = () => {
    $$(".tm-table.is-selected").forEach((b) => b.classList.remove("is-selected"))
    $$(".wtm-item.is-active").forEach((it) => it.classList.remove("is-active"))
    pickTable.textContent = "—"
    pickArea.textContent = "—"
    pickSeats.textContent = "—"
    pickStatus.textContent = "—"
    pickGuest.textContent = "—"
    pickTotal.textContent = "—"
    btnOpenBill.disabled = true
    btnPay.disabled = true
  }

  const setSelected = (id) => {
    selectedId = id
    $$(".tm-table.is-selected").forEach((b) => b.classList.remove("is-selected"))
    $$(".wtm-item.is-active").forEach((it) => it.classList.remove("is-active"))

    const btn = $(`.tm-table[data-id="${CSS.escape(id)}"]`)
    if (btn) btn.classList.add("is-selected")

    const row = $(`.wtm-item[data-id="${CSS.escape(id)}"]`)
    if (row) row.classList.add("is-active")

    const t = tables.find((x) => x.id === id)
    if (!t) return clearSelectedUI()

    const a = AREA_META[t.area]?.title || t.area
    const sm = statusMeta(t.billStatus)

    pickTable.textContent = t.code || "—"
    pickArea.textContent = a || "—"
    pickSeats.textContent = t.seats ? `${t.seats}` : "—"
    pickStatus.textContent = sm.label
    pickGuest.textContent = t.guestCount ? `${t.guestCount}` : "—"
    pickTotal.textContent = t.billTotal ? fmtVnd(t.billTotal) : "—"

    const hasBill = t.billTotal > 0 || t.guestCount > 0
    btnOpenBill.disabled = !hasBill
    btnPay.disabled = !(hasBill && t.billStatus !== "PAID")
  }

  const buildTableBtn = (t) => {
    const sm = statusMeta(t.billStatus)
    const b = document.createElement("button")
    b.type = "button"
    b.className = `tm-table ${sm.cls}`
    b.dataset.id = t.id

    const code = document.createElement("span")
    code.className = "t-code"
    code.textContent = t.code

    const meta = document.createElement("span")
    meta.className = "t-meta"
    meta.textContent = t.seats ? `${t.seats} chỗ` : "—"

    b.append(code, meta)

    const show = elShow.value
    if (show !== "none") {
      const badge = document.createElement("span")
      badge.className = "t-badge"
      if (show === "session") {
        const mins = toMinutes(t.seatedAt)
        badge.textContent = mins == null ? "—" : `${mins} phút`
      } else {
        badge.textContent = t.billTotal ? fmtVnd(t.billTotal) : "—"
      }
      b.appendChild(badge)
    }

    b.addEventListener("click", () => setSelected(t.id))
    return b
  }

  const renderAreas = () => {
    elAreas.innerHTML = ""
    const floor = elFloor.value
    const list = floor === "all" ? tables : tables.filter((t) => t.area === floor)
    const grouped = groupByArea(list)

    if (!grouped.length) {
      const empty = document.createElement("div")
      empty.className = "tm-area"
      empty.innerHTML = `<div class="tm-area-head"><h4>Không có dữ liệu</h4><span class="tm-area-sub">Mock rỗng</span></div>`
      elAreas.appendChild(empty)
      return
    }

    for (const [areaKey, arr] of grouped) {
      const sec = document.createElement("section")
      sec.className = "tm-area"

      const head = document.createElement("div")
      head.className = "tm-area-head"

      const h4 = document.createElement("h4")
      h4.textContent = AREA_META[areaKey]?.title || areaKey

      const sub = document.createElement("span")
      sub.className = "tm-area-sub"
      sub.textContent = AREA_META[areaKey]?.sub || ""

      head.append(h4, sub)

      const grid = document.createElement("div")
      grid.className = "tm-grid"
      arr.forEach((t) => grid.appendChild(buildTableBtn(t)))

      sec.append(head, grid)
      elAreas.appendChild(sec)
    }
  }

  const buildListItem = (t) => {
    const sm = statusMeta(t.billStatus)

    const it = document.createElement("div")
    it.className = "wtm-item"
    it.dataset.id = t.id

    const top = document.createElement("div")
    top.className = "wtm-item-top"

    const name = document.createElement("div")
    name.className = "wtm-item-name"
    name.textContent = t.code

    const badge = document.createElement("span")
    badge.className = `badge ${sm.badge}`
    badge.textContent = sm.label

    top.append(name, badge)

    const sub = document.createElement("div")
    sub.className = "wtm-item-sub"

    const a = document.createElement("span")
    a.textContent = AREA_META[t.area]?.title || t.area

    const total = document.createElement("span")
    total.textContent = t.billTotal ? fmtVnd(t.billTotal) : "—"

    sub.append(a, total)

    it.append(top, sub)
    it.addEventListener("click", () => setSelected(t.id))
    return it
  }

  const renderList = () => {
    elList.innerHTML = ""
    const visible = tables.filter((t) => t.billStatus !== "PAID")
    if (!visible.length) {
      const d = document.createElement("div")
      d.className = "wtm-item"
      d.style.cursor = "default"
      d.innerHTML = `<div class="wtm-item-top"><div class="wtm-item-name">Không có bàn cần xử lý</div><span class="badge is-paid">OK</span></div><div class="wtm-item-sub"><span>Danh sách trống</span><span>—</span></div>`
      elList.appendChild(d)
      return
    }
    visible.forEach((t) => elList.appendChild(buildListItem(t)))
  }

  const renderAll = () => {
    clearSelectedUI()
    renderAreas()
    renderList()
  }

  const load = () => {
    const fromTpl = readMock()
    tables = (fromTpl && fromTpl.length ? fromTpl : DEFAULT_DATA).map((t) => ({
      ...t,
      billStatus: String(t.billStatus || "UNPAID").toUpperCase()
    }))
    selectedId = null
    renderAll()
  }

  btnClear?.addEventListener("click", () => {
    selectedId = null
    renderAll()
  })

  btnRefresh?.addEventListener("click", () => load())

  elFloor?.addEventListener("change", () => {
    selectedId = null
    renderAll()
  })

  elShow?.addEventListener("change", () => {
    const keep = selectedId
    renderAreas()
    if (keep) setSelected(keep)
  })

  btnOpenBill?.addEventListener("click", () => {
    if (!selectedId) return
    alert("Mock: mở bill của " + selectedId)
  })

  btnPay?.addEventListener("click", () => {
  if (!selectedId) return
  const url = `/dinio/cashier/payment?tableId=${encodeURIComponent(selectedId)}`
  window.location.href = url
})

  load()
})
