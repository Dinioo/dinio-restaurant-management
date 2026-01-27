package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
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
}
