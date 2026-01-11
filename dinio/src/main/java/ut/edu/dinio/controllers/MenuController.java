package ut.edu.dinio.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class MenuController {

  @GetMapping("/menu-items")
  public String menu_admin() {
    return "admin/menu-items";
  }
  @GetMapping("/menu")
  public String menu_customer() {
    return "customer/menu";
  }
    @GetMapping("/reservation/tables")

  public String tableMap() {
    return "customer/table-map";
  }
  @GetMapping("/reservation")
  public String reservation() {
    return "customer/reservation";
  }


  @GetMapping("/menu/newdish")
  public String newDishPage(Model model) {

    model.addAttribute("categoryOptions", List.of(
      Map.of("value", "starter", "text", "Starters"),
      Map.of("value", "main", "text", "Main"),
      Map.of("value", "dessert", "text", "Desserts"),
      Map.of("value", "drink", "text", "Drinks")
    ));
    model.addAttribute("selectedCategory", "main");

    model.addAttribute("statusOptions", List.of(
      Map.of("value", "available", "text", "Available"),
      Map.of("value", "soldout", "text", "Sold out"),
      Map.of("value", "hidden", "text", "Hidden")
    ));
    model.addAttribute("selectedStatus", "available");

    model.addAttribute("spiceLevelOptions", List.of(
      Map.of("value", "none", "text", "Not spicy"),
      Map.of("value", "mild", "text", "Mild"),
      Map.of("value", "medium", "text", "Medium"),
      Map.of("value", "hot", "text", "Hot")
    ));
    model.addAttribute("selectedSpiceLevel", "none");

    return "admin/menu-newdish";
  }

  @PostMapping("/menu-items/newdish")
  public String createDish(
      @RequestParam String name,
      @RequestParam(required = false) String description,
      @RequestParam Long price,
      @RequestParam String category,
      @RequestParam(required = false) List<String> tags,
      @RequestParam(required = false) List<String> allergens,
      @RequestParam(required = false) String allergenNote,
      @RequestParam(required = false) Integer calories,
      @RequestParam(required = false) String spiceLevel,
      @RequestParam String image,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String label
  ) {
    return "redirect:/menu-items";
  }
}
