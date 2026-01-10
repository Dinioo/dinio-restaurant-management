package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
public class HomeController {

  @GetMapping("/")
  public String home() {
    return "customer/home";
  }

  // ===== MY RESERVATIONS =====
  @GetMapping("/reservations/my")
  public String myReservations(Model model) {

    // TODO: sau này thay bằng dữ liệu từ DB theo user đăng nhập
    model.addAttribute("reservations", List.of(
        // để tạm empty list cho khỏi lỗi thymeleaf
        // hoặc mock data nếu muốn xem UI
    ));

    return "customer/reservations-my";
  }
}
