
package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class CashierController {

    @GetMapping("/cashier/tables")
    public String cashierTableMap(Model model) {
        model.addAttribute("active", "cashier_tables");
        return "cashier/cashier-table-map";
    }

    @GetMapping("/cashier/dashboard")
    public String cashierDashboard(Model model) {
        model.addAttribute("active", "cashier_dashboard");
        return "cashier/cashier-dashboard";
    }

    @GetMapping("/cashier/billing")
    public String cashierBilling(
            @RequestParam(required = false) String tableId,
            @RequestParam(required = false) String sessionId,
            Model model
    ) {
        model.addAttribute("tableId", tableId == null ? "" : tableId);
        model.addAttribute("sessionId", sessionId == null ? "" : sessionId);
        model.addAttribute("active", "cashier_checkout");

        return "cashier/cashier-billing";
    }
}

