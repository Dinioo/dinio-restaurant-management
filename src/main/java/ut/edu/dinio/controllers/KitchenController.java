package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
@Controller
public class KitchenController {

  // KDS chính – bếp dùng 90% thời gian
  @GetMapping("/kitchen")
  public String kitchenKds() {
    return "kitchen/kitchen-kds";
  }

  // Lịch sử món đã xong
  @GetMapping("/kitchen/history")
  public String kitchenHistory() {
    return "kitchen/kitchen-history";
  }
}