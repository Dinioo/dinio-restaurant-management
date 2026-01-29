package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class CashierController {

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
}
