package ut.edu.dinio.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.service.MenuItemService;

@Controller
public class HomeController {

  @Autowired
  private MenuItemService menuItemService;

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

  // ===== TEST MENU ITEMS =====
  @GetMapping("/test-items")
  public String testItems(Model model) {
    try {
      // Lấy tất cả món ăn từ database
      List<MenuItem> allItems = menuItemService.getAllActiveItems();
      model.addAttribute("menuItems", allItems);
      
      // Lấy món yêu thích (có tag BEST hoặc SIGNATURE)
      List<MenuItem> favoriteItems = menuItemService.getFavoriteItems();
      model.addAttribute("favoriteItems", favoriteItems);
      
      // Thêm thông tin thống kê
      model.addAttribute("totalItems", allItems.size());
      model.addAttribute("favoriteCount", favoriteItems.size());
      
    } catch (Exception e) {
      System.out.println("Error loading menu items: " + e.getMessage());
      e.printStackTrace();
      model.addAttribute("menuItems", List.of());
      model.addAttribute("favoriteItems", List.of());
      model.addAttribute("error", "Không thể tải dữ liệu món ăn: " + e.getMessage());
    }
    
    return "customer/test_item";
  }
}
