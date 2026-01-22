package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WaiterController {

  @GetMapping("/waiter/tables")
  public String waiterTableMap(Model model) {
    return "waiter/waiter-table-map";
  }

  @GetMapping("/waiter/order")
  public String waiterOrder(
      @RequestParam(required = false) String tableId,
      Model model) {

    model.addAttribute("tableId", tableId == null ? "—" : tableId);
    return "waiter/waiter-order";
  }
}
