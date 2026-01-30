package ut.edu.dinio.controllers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import ut.edu.dinio.service.InvoiceService;

@Controller
public class CashierController {

    @Autowired
    private InvoiceService invoiceService;

    @GetMapping("/cashier/tables")
    public String cashierTableMap() {
        return "cashier/cashier-table-map";
    }

    @GetMapping("/cashier/dashboard")
    public String cashierDashboard() {
        return "cashier/cashier-dashboard";
    }

    @GetMapping("/cashier/shift-summary")
    public String cashierShiftSummary() {
        return "cashier/cashier-shift-summary";
    }

    @GetMapping("/cashier/bills")
    public String cashierBills() {
        return "cashier/cashier-bills";
    }

    @GetMapping("/cashier/pending")
    public String cashierPeding() {
        return "cashier/cashier-pending";
    }

    @GetMapping("/cashier/payment")
    public String cashierPayment() {
        return "cashier/cashier-payment";
    }

    // ========== API ENDPOINTS ==========

    /**
     * API: Lấy danh sách bàn với thông tin bill
     * GET /api/cashier/tables-with-bills
     */
    @GetMapping("/api/cashier/tables-with-bills")
    @ResponseBody
    public ResponseEntity<?> getTablesWithBills() {
        try {
            List<Map<String, Object>> tables = invoiceService.getTablesWithBillInfo();
            return ResponseEntity.ok(tables);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Không thể tải danh sách bàn",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * API: Lấy chi tiết hóa đơn để thanh toán
     * GET /api/cashier/payment-detail?tableId=1
     */
    @GetMapping("/api/cashier/payment-detail")
    @ResponseBody
    public ResponseEntity<?> getPaymentDetail(@RequestParam Integer tableId) {
        try {
            Map<String, Object> detail = invoiceService.getPaymentDetail(tableId);
            return ResponseEntity.ok(detail);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Không thể tải thông tin thanh toán",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * API: Xử lý thanh toán
     * POST /api/cashier/process-payment
     * Body: { "tableId": 1, "paymentMethod": "CASH", "amount": 250000 }
     */
    @PostMapping("/api/cashier/process-payment")
    @ResponseBody
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> payload) {
        try {
            Integer tableId = Integer.valueOf(payload.get("tableId").toString());
            String paymentMethod = payload.get("paymentMethod").toString();
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());

            Map<String, Object> result = invoiceService.processPayment(tableId, paymentMethod, amount);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Thanh toán thất bại",
                "message", e.getMessage()
            ));
        }
    }
}
