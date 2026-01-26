package ut.edu.dinio.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.enums.TableStatus;
import ut.edu.dinio.service.TableMapService;

@Controller
public class WaiterController {

  @Autowired
  private TableMapService tableMapService;

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

  @PostMapping("/api/tables/{id}/status")
  @ResponseBody
  public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestParam TableStatus status, HttpSession session) {
    try {
      StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
      tableMapService.updateTableStatus(id, status, currentStaff);
      return ResponseEntity.ok(Map.of("status", "success"));
    } catch (Exception e) {
      return ResponseEntity.status(500).body(e.getMessage());
    }
  }

  @PostMapping("/api/tables/{id}/close-session")
  @ResponseBody
  public ResponseEntity<?> closeSession(@PathVariable Integer id) {
    tableMapService.closeSession(id);
    return ResponseEntity.ok(Map.of("status", "success"));
  }

  @GetMapping("/api/reservations/{id}/guest-name")
  @ResponseBody
  public ResponseEntity<?> getGuestName(@PathVariable Integer id) {
    String name = tableMapService.getGuestNameByReservationId(id);
    if (name != null) {
      return ResponseEntity.ok(Map.of("name", name));
    }
    return ResponseEntity.notFound().build();
  }
}
