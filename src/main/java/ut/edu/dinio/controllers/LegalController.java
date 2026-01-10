package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LegalController {

  @GetMapping("/terms")
  public String terms() {
    return "customer/terms";
  }

  @GetMapping("/privacy")
  public String privacy() {
    return "customer/privacy";
  }
}
