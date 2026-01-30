package ut.edu.dinio.controllers;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import ut.edu.dinio.service.BillService;

@Controller
public class CashierBillController {

    @Autowired
    private BillService billService;

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
                "message", e.getMessage()
            ));
        }
    }
}