package ut.edu.dinio.controllers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.service.InvoiceService;
import ut.edu.dinio.service.ReservationService;
import ut.edu.dinio.service.VNPayService;

@Controller
public class CashierController {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private VNPayService vnPayService;

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

    @GetMapping("/api/cashier/tables-with-bills")
    @ResponseBody
    public ResponseEntity<?> getTablesWithBills() {
        try {
            List<Map<String, Object>> tables = invoiceService.getTablesWithBillInfo();
            return ResponseEntity.ok(tables);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Không thể tải danh sách bàn",
                    "message", e.getMessage()));
        }
    }

    @GetMapping("/api/cashier/payment-detail")
    @ResponseBody
    public ResponseEntity<?> getPaymentDetail(@RequestParam Integer tableId) {
        try {
            Map<String, Object> detail = invoiceService.getPaymentDetail(tableId);
            return ResponseEntity.ok(detail);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Không thể tải thông tin thanh toán",
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/api/cashier/process-payment")
    @ResponseBody
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> payload, HttpSession session) {
        try {
            Integer tableId = Integer.valueOf(payload.get("tableId").toString());
            String paymentMethod = payload.get("paymentMethod").toString();
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());

            StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
            Map<String, Object> result = invoiceService.processPayment(tableId, paymentMethod, amount, currentStaff);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Thanh toán thất bại",
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/api/cashier/create-vnpay-payment")
    @ResponseBody
    public ResponseEntity<?> createVNPayPayment(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            Integer tableId = Integer.valueOf(payload.get("tableId").toString());
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            
            String ipAddress = getClientIP(request);
            String paymentUrl = vnPayService.createPaymentUrl(tableId, amount.longValue(), ipAddress);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "paymentUrl", paymentUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Không thể tạo link thanh toán VNPay",
                "message", e.getMessage()
            ));
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    @GetMapping("/api/cashier/reservations")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getReservations(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(reservationService.getAllReservationsByDate(date));
    }

    @PostMapping("/api/cashier/reservations/{id}/confirm")
    @ResponseBody
    public ResponseEntity<?> confirm(@PathVariable Integer id, HttpSession session) {
        try {
            StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
            reservationService.confirmReservation(id, currentStaff);
            return ResponseEntity.ok(Map.of("message", "Xác nhận thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/cashier/reservations/{id}/reject")
    @ResponseBody
    public ResponseEntity<?> reject(@PathVariable Integer id, HttpSession session) {
        try {
            StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
            reservationService.cancelReservation(id, currentStaff);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối và hủy các món đặt trước"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
