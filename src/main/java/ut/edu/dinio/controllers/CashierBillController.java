package ut.edu.dinio.controllers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.Invoice;
import ut.edu.dinio.pojo.InvoiceLine;
import ut.edu.dinio.pojo.OrderItem;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.SessionStatus;
import ut.edu.dinio.repositories.DiningTableRepository;
import ut.edu.dinio.repositories.TableSessionRepository;
import ut.edu.dinio.service.BillService;

@Controller
public class CashierBillController {

    @Autowired
    private BillService billService;
    @Autowired
    private DiningTableRepository diningTableRepository;
    @Autowired
    private TableSessionRepository tableSessionRepository;

    @GetMapping("/api/cashier/bills")
    public ResponseEntity<List<Map<String, Object>>> getBills(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(billService.getPaidBillsByDate(date));
    }

    @PostMapping("/api/cashier/bills/{id}/void")
    @ResponseBody
    public ResponseEntity<?> voidBill(@PathVariable Integer id) {
        try {
            billService.voidPayment(id);
            return ResponseEntity.ok(Map.of("message", "Hóa đơn đã được xóa vĩnh viễn"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Lỗi khi xóa hóa đơn",
                    "message", e.getMessage()));
        }
    }

    @GetMapping("/cashier/api/bill-preview")
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