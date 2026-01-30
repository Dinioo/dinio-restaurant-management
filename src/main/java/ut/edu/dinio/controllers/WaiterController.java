package ut.edu.dinio.controllers;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.Invoice;
import ut.edu.dinio.pojo.InvoiceLine;
import ut.edu.dinio.pojo.KitchenTicket;
import ut.edu.dinio.pojo.MenuCategory;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.Order;
import ut.edu.dinio.pojo.OrderItem;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.SessionStatus;
import ut.edu.dinio.pojo.enums.TableStatus;
import ut.edu.dinio.repositories.DiningTableRepository;
import ut.edu.dinio.repositories.MenuCategoryRepository;
import ut.edu.dinio.repositories.MenuItemRepository;
import ut.edu.dinio.repositories.OrderItemRepository;
import ut.edu.dinio.repositories.OrderRepository;
import ut.edu.dinio.repositories.TableSessionRepository;
import ut.edu.dinio.service.InvoiceService;
import ut.edu.dinio.service.OrderService;
import ut.edu.dinio.service.TableMapService;

@Controller
public class WaiterController {

  private final DiningTableRepository diningTableRepository;
  private final TableSessionRepository tableSessionRepository;
  private final OrderRepository orderRepository;
  private final OrderItemRepository orderItemRepository;
  private final MenuCategoryRepository menuCategoryRepository;
  private final MenuItemRepository menuItemRepository;
  private final OrderService orderService;
  private final InvoiceService invoiceService;

  public WaiterController(
      DiningTableRepository diningTableRepository,
      TableSessionRepository tableSessionRepository,
      OrderRepository orderRepository,
      OrderItemRepository orderItemRepository,
      MenuCategoryRepository menuCategoryRepository,
      MenuItemRepository menuItemRepository,
      OrderService orderService,
      InvoiceService invoiceService) {
    this.diningTableRepository = diningTableRepository;
    this.tableSessionRepository = tableSessionRepository;
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.menuCategoryRepository = menuCategoryRepository;
    this.menuItemRepository = menuItemRepository;
    this.orderService = orderService;
    this.invoiceService = invoiceService;
  }

  @Autowired
  private TableMapService tableMapService;

  @GetMapping("/waiter/dashboard")
  public String waiterDashboard() {
    return "component/dashboard";
  }

  @GetMapping("/waiter/tables")
  public String waiterTableMap() {
    return "waiter/waiter-table-map";
  }

  @GetMapping("/waiter/order")
  public String waiterOrder(@RequestParam(required = false) String tableId, Model model) {
    model.addAttribute("tableId", tableId == null ? "—" : tableId);
    return "waiter/waiter-order";
  }

  @GetMapping("/waiter/order-detail")
  public String waiterOrderDetail() {
    return "waiter/waiter-order-detail";
  }

  @GetMapping("/waiter/api/order-detail")
  @ResponseBody
  public ResponseEntity<?> getOrderDetail(@RequestParam Integer tableId) {
    DiningTable table = diningTableRepository.findById(tableId).orElse(null);
    if (table == null)
      return ResponseEntity.notFound().build();

    TableSession session = tableSessionRepository
        .findTopByTableIdAndStatusOrderByOpenedAtDesc(tableId, SessionStatus.OPEN)
        .orElse(null);

    Map<String, Object> res = new HashMap<>();

    Map<String, Object> tableJson = new HashMap<>();
    tableJson.put("id", table.getId());
    tableJson.put("code", table.getCode());
    tableJson.put("seats", table.getSeats());
    tableJson.put("status", table.getStatus().name());
    tableJson.put("areaName", table.getArea() != null ? table.getArea().getName() : "");
    res.put("table", tableJson);

    if (session == null) {
      res.put("session", null);
      res.put("orders", List.of());
      return ResponseEntity.ok(res);
    }

    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    Map<String, Object> sessionJson = new HashMap<>();
    sessionJson.put("id", session.getId());
    sessionJson.put("covers", session.getCovers() == null ? 0 : session.getCovers());
    sessionJson.put("status", session.getStatus() == null ? "" : session.getStatus().name());
    sessionJson.put("openedAt", session.getOpenedAt() != null ? session.getOpenedAt().format(fmt) : "");
    res.put("session", sessionJson);

    List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(session.getId());

    List<Map<String, Object>> ordersJson = new ArrayList<>();
    for (Order o : orders) {
      Map<String, Object> oJson = new HashMap<>();
      oJson.put("id", o.getId());
      oJson.put("createdAt", o.getCreatedAt() != null ? o.getCreatedAt().format(fmt) : null);
      oJson.put("status", o.getStatus().name());

      List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(o.getId());

      List<Map<String, Object>> itemsJson = new ArrayList<>();
      for (OrderItem it : items) {
        Map<String, Object> itJson = new HashMap<>();
        itJson.put("id", it.getId());
        itJson.put("qty", it.getQty());
        itJson.put("unitPrice", it.getUnitPrice());
        itJson.put("note", it.getNote());
        itJson.put("status", it.getStatus().name());

        MenuItem mi = null;
        try {
          mi = it.getMenuItem();
        } catch (Exception ignored) {
        }
        itJson.put("menuItemId", mi != null ? mi.getId() : null);
        itJson.put("menuItemName", mi != null ? mi.getName() : "—");

        itemsJson.add(itJson);
      }

      oJson.put("items", itemsJson);
      ordersJson.add(oJson);
    }

    res.put("orders", ordersJson);
    return ResponseEntity.ok(res);
  }

  @GetMapping("/waiter/api/order/new-data")
  @ResponseBody
  public ResponseEntity<?> waiterNewOrderData(@RequestParam Integer tableId) {
    DiningTable table = diningTableRepository.findById(tableId).orElse(null);
    if (table == null)
      return ResponseEntity.notFound().build();

    TableSession session = tableSessionRepository
        .findTopByTableIdAndStatusOrderByOpenedAtDesc(tableId, SessionStatus.OPEN)
        .orElse(null);

    List<MenuCategory> cats = menuCategoryRepository.findAll();
    List<MenuItem> items = menuItemRepository.findAllActiveItems();

    Map<String, Object> res = new HashMap<>();

    res.put("table", Map.of(
        "id", table.getId(),
        "code", table.getCode(),
        "seats", table.getSeats(),
        "status", table.getStatus().name(),
        "areaName", table.getArea() != null ? table.getArea().getName() : ""));

    if (session == null) {
      res.put("session", null);
    } else {
      res.put("session", Map.of(
          "id", session.getId(),
          "covers", session.getCovers(),
          "status", session.getStatus().name(),
          "openedAt", session.getOpenedAt()));
    }

    List<Map<String, Object>> catsJson = new ArrayList<>();
    for (MenuCategory c : cats) {
      catsJson.add(Map.of("id", c.getId(), "name", c.getName()));
    }

    List<Map<String, Object>> itemsJson = new ArrayList<>();
    for (MenuItem mi : items) {
      itemsJson.add(Map.of(
          "id", mi.getId(),
          "name", mi.getName(),
          "price", mi.getBasePrice(), // hoặc getPrice() tùy entity bạn
          "categoryId", mi.getCategory() != null ? mi.getCategory().getId() : null,
          "categoryName", mi.getCategory() != null ? mi.getCategory().getName() : ""));
    }

    res.put("categories", catsJson);
    res.put("items", itemsJson);

    return ResponseEntity.ok(res);
  }

  @PostMapping("/waiter/api/order/send-kitchen")
  @ResponseBody
  public ResponseEntity<?> sendKitchen(
      @RequestParam Integer tableId,
      @RequestBody Map<String, Object> body,
      HttpSession httpSession) {
    DiningTable table = diningTableRepository.findById(tableId).orElse(null);
    if (table == null)
      return ResponseEntity.notFound().build();

    TableSession session = tableSessionRepository
        .findTopByTableIdAndStatusOrderByOpenedAtDesc(tableId, SessionStatus.OPEN)
        .orElse(null);

    if (session == null) {
      return ResponseEntity.badRequest().body("Bàn chưa có session đang mở");
    }

    List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");

    StaffUser currentStaff = (StaffUser) httpSession.getAttribute("currentStaff");
    KitchenTicket ticket = orderService.sendToKitchen(session, items, currentStaff);

    return ResponseEntity.ok(Map.of(
        "status", "success",
        "ticketId", ticket.getId(),
        "orderId", ticket.getOrder().getId()));
  }

  @GetMapping("/waiter/bill/review")
  public String waiterBillReview(@RequestParam(required = false) String tableId, Model model) {
    model.addAttribute("tableId", tableId == null ? "—" : tableId);
    return "waiter/waiter-bill-review";
  }

  @PostMapping("/api/tables/{id}/status")
  @ResponseBody
  public ResponseEntity<?> updateStatus(
      @PathVariable Integer id,
      @RequestParam TableStatus status,
      HttpSession session) {
    StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");

     try {
       tableMapService.updateTableStatus(id, status, currentStaff);
       return ResponseEntity.ok(Map.of("status", "success"));

     } catch (RuntimeException ex) {
       return ResponseEntity.status(409).body(Map.of(
           "status", "error",
           "message", ex.getMessage()));
     } catch (Exception ex) {
       ex.printStackTrace();
       return ResponseEntity.status(500).body(Map.of(
           "status", "error",
           "message", "Server error: " + ex.getMessage()));
     }
  }

  @PostMapping("/api/tables/{id}/close-session")
  @ResponseBody
  public ResponseEntity<?> closeSession(@PathVariable Integer id, HttpSession session) {
    StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
    tableMapService.closeSession(id, currentStaff);
    return ResponseEntity.ok(Map.of("status", "success"));
  }

  @GetMapping("/api/reservations/{id}/guest-name")
  @ResponseBody
  public ResponseEntity<?> getGuestName(@PathVariable Integer id) {
    String name = tableMapService.getGuestNameByReservationId(id);
    if (name != null) {
      return ResponseEntity.ok(Map.of("name", name));
    }
    return ResponseEntity.notFound().build();
  }

  @GetMapping("/waiter/api/bill-preview")
  @ResponseBody
  @Transactional(readOnly = true)
  public ResponseEntity<?> getBillPreview(@RequestParam Integer tableId) {

    DiningTable table = diningTableRepository.findById(tableId).orElse(null);
    if (table == null)
      return ResponseEntity.notFound().build();

    // response root
    Map<String, Object> root = new HashMap<>();

    // table json (area có thể null)
    Map<String, Object> tableJson = new HashMap<>();
    tableJson.put("id", table.getId());
    tableJson.put("code", table.getCode());
    tableJson.put("seats", table.getSeats());
    tableJson.put("status", table.getStatus() != null ? table.getStatus().name() : "");
    tableJson.put("areaName",
        (table.getArea() != null && table.getArea().getName() != null) ? table.getArea().getName() : "");
    root.put("table", tableJson);

    TableSession session = tableSessionRepository
        .findTopByTableIdAndStatusInOrderByOpenedAtDesc(
            tableId,
            java.util.List.of(SessionStatus.OPEN, SessionStatus.CHECK_REQUESTED))
        .orElse(null);

    if (session == null) {
      root.put("session", null); // HashMap cho phép null value
      root.put("invoice", null);
      return ResponseEntity.ok(root);
    }

    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    Map<String, Object> sessionJson = new HashMap<>();
    sessionJson.put("id", session.getId());
    sessionJson.put("covers", session.getCovers() == null ? 0 : session.getCovers());
    sessionJson.put("status", session.getStatus() != null ? session.getStatus().name() : "");
    sessionJson.put("openedAt", session.getOpenedAt() != null ? session.getOpenedAt().format(fmt) : "");
    root.put("session", sessionJson);

    Invoice inv = session.getInvoice();
    if (inv == null) {
      root.put("invoice", null);
      return ResponseEntity.ok(root);
    }

    List<Map<String, Object>> lines = new ArrayList<>();
    if (inv.getLines() != null) {
      for (InvoiceLine ln : inv.getLines()) {
        OrderItem oi = ln.getOrderItem();

        String name = "—";
        String note = null;

        BigDecimal unitPrice = ln.getPrice();

        int qty = (ln.getQty() == null) ? 0 : ln.getQty();

        if (oi != null) {
          note = oi.getNote();
          if (oi.getUnitPrice() != null)
            unitPrice = oi.getUnitPrice();
          if (oi.getMenuItem() != null && oi.getMenuItem().getName() != null) {
            name = oi.getMenuItem().getName();
          }
        }

        BigDecimal up = (unitPrice == null) ? BigDecimal.ZERO : unitPrice;
        BigDecimal lineTotal = up.multiply(BigDecimal.valueOf(qty));

        Map<String, Object> line = new HashMap<>();
        line.put("id", ln.getId());
        line.put("name", name);
        line.put("qty", qty);
        line.put("unitPrice", up);
        line.put("lineTotal", lineTotal);
        line.put("note", note); // có thể null OK
        lines.add(line);
      }
    }

    Map<String, Object> invJson = new HashMap<>();
    invJson.put("id", inv.getId());
    invJson.put("status", inv.getStatus() != null ? inv.getStatus().name() : "");
    invJson.put("subtotal", inv.getSubtotal() == null ? BigDecimal.ZERO : inv.getSubtotal());
    invJson.put("tax", inv.getTax() == null ? BigDecimal.ZERO : inv.getTax());
    invJson.put("serviceCharge", inv.getServiceCharge() == null ? BigDecimal.ZERO : inv.getServiceCharge());
    invJson.put("discountTotal", inv.getDiscountTotal() == null ? BigDecimal.ZERO : inv.getDiscountTotal());
    invJson.put("total", inv.getTotal() == null ? BigDecimal.ZERO : inv.getTotal());
    invJson.put("lines", lines);

    root.put("invoice", invJson);

    return ResponseEntity.ok(root);
  }

}
