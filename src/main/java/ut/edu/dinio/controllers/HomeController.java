package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

  @GetMapping("/")
  public String home() {
    return "pages/home"; // templates/pages/home.html
  }

  @GetMapping("/menu")
  public String menu() {
    return "pages/menu"; // templates/pages/menu.html
  }
}
