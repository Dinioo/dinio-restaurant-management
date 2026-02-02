package ut.edu.dinio.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.service.KitchenService;
@Controller
public class KitchenController {

  @Autowired
  private KitchenService kitchenService;

  @GetMapping("/kitchen/dashboard")
  public String kitchenKds() {
    return "kitchen/kitchen-kds";
  }
   @GetMapping("/kitchen/notifications")
  public String kitchennNotifications() {
    return "kitchen/notifications";
  }

  @GetMapping("/kitchen/history")
  public String kitchenHistory() {
    return "kitchen/kitchen-history";
  }

  @GetMapping("/api/kitchen/items")
  @ResponseBody
  public List<Map<String, Object>> getItems() {
    return kitchenService.getKitchenOrders();
  }

  @PostMapping("/api/kitchen/items/{id}/next")
  @ResponseBody
  public Map<String, Object> nextStatus(@PathVariable Integer id, HttpSession session) {
    StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
    return kitchenService.updateNextStatus(id, currentStaff);
  }
}