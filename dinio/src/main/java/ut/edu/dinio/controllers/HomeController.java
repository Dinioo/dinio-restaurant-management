package ut.edu.dinio.controllers;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

  @GetMapping("/")
  public String home() {
    return "pages/home"; // trỏ tới templates/pages/home.html
  }
}
