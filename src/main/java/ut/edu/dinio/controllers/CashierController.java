package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

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
}
