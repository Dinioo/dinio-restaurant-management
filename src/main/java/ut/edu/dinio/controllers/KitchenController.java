package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
public class KitchenController {

  @GetMapping("/kitchen/dashboard")
  public String kitchenKds() {
    return "kitchen/kitchen-kds";
  }

  @GetMapping("/kitchen/history")
  public String kitchenHistory() {
    return "kitchen/kitchen-history";
  }
}