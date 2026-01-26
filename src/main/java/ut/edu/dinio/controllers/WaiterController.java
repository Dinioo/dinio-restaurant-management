package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WaiterController {
    @GetMapping("/waiter/dashboard")
  public String waiterDashboard() {
    return "waiter/waiter-dashboard";
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
  public String waiterOrderDetail(@RequestParam(required = false) String tableId, Model model) {
    model.addAttribute("tableId", tableId == null ? "—" : tableId);
    return "waiter/waiter-order-detail";
  }

  @GetMapping("/waiter/bill/review")
  public String waiterBillReview(@RequestParam(required = false) String tableId, Model model) {
    model.addAttribute("tableId", tableId == null ? "—" : tableId);
    return "waiter/waiter-bill-review";
  }
}
