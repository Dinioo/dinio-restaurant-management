package ut.edu.dinio.controllers;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import ut.edu.dinio.pojo.MenuCategory;
import ut.edu.dinio.pojo.enums.AllergyTag;
import ut.edu.dinio.pojo.enums.ItemTag;
import ut.edu.dinio.repositories.MenuCategoryRepository;
import ut.edu.dinio.service.MenuItemService;
import ut.edu.dinio.service.MenuViewService;

@Controller
public class MenuController {
  private final MenuViewService menuViewService;
  private final MenuCategoryRepository menuCategoryRepository;
  private final MenuItemService menuItemService;
  

  public MenuController(MenuViewService menuViewService, MenuCategoryRepository menuCategoryRepository, MenuItemService menuItemService) {
    this.menuViewService = menuViewService;
    this.menuCategoryRepository = menuCategoryRepository;
    this.menuItemService = menuItemService;
  }

@GetMapping("/menu-items")
public String menu_admin(
    @RequestParam(value = "q", required = false) String q,
    @RequestParam(value = "cat", required = false) Integer cat,
    @RequestParam(value = "tag", required = false) String tag,
    @RequestParam(value = "sort", required = false) String sort,
    Model model
) {
  var data = menuViewService.getMenuPageData(q, cat, tag, sort);

  model.addAttribute("categories", data.categories);
  model.addAttribute("itemsByCategory", data.itemsByCategory);
  model.addAttribute("totalCount", data.totalCount);

  model.addAttribute("q", data.q);
  model.addAttribute("cat", data.cat);
  model.addAttribute("tag", data.tag == null ? null : data.tag.trim().toLowerCase());
  model.addAttribute("sort", data.sort);

  model.addAttribute("tags", ut.edu.dinio.pojo.enums.ItemTag.values());

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

  @GetMapping("/preorder")
public String preorderPage() {
  return "customer/preorder";
}


  @GetMapping("/reservation")
  public String reservation() {
    return "customer/reservation";
  }

@GetMapping("/menu/newdish")
public String newDishPage(Model model) {

  List<MenuCategory> categories = menuCategoryRepository.findAllByOrderBySortOrderAscNameAsc();

  model.addAttribute("categoryOptions", categories.stream()
      .map(c -> Map.<String, Object>of("value", String.valueOf(c.getId()), "text", c.getName()))
      .collect(Collectors.toList()));

  model.addAttribute("selectedCategory", categories.isEmpty() ? "" : String.valueOf(categories.get(0).getId()));

  model.addAttribute("statusOptions", List.of(
      Map.of("value", "available", "text", "Available"),
      Map.of("value", "soldout", "text", "Sold out"),
      Map.of("value", "hidden", "text", "Hidden")));
  model.addAttribute("selectedStatus", "available");

  model.addAttribute("spiceLevelOptions", List.of(
      Map.of("value", "none", "text", "Not spicy"),
      Map.of("value", "mild", "text", "Mild"),
      Map.of("value", "medium", "text", "Medium"),
      Map.of("value", "hot", "text", "Hot")));
  model.addAttribute("selectedSpiceLevel", "none");

  model.addAttribute("tagEnums", ItemTag.values());
  model.addAttribute("allergenEnums", AllergyTag.values());

  return "admin/menu-newdish";
}
  @PostMapping("/menu-items/newdish")
public String createDish(
    @RequestParam String name,
    @RequestParam(required = false) String description,
    @RequestParam Long price,
    @RequestParam Integer category,
    @RequestParam(required = false) List<String> tags,
    @RequestParam(required = false) List<String> allergens,
    @RequestParam(required = false) Integer calories,
    @RequestParam(required = false) String spiceLevel,
    @RequestParam(required = false) String ingredients,
    @RequestParam(required = false) String status,
    @RequestParam("imageFile") MultipartFile imageFile
) {
  try {
    System.out.println("=== CREATE DISH ===");
    System.out.println("name=" + name);
    System.out.println("price=" + price);
    System.out.println("category=" + category);
    System.out.println("tags=" + tags);
    System.out.println("allergens=" + allergens);
    System.out.println("imageFile null? " + (imageFile == null));
    System.out.println("imageFile empty? " + (imageFile != null && imageFile.isEmpty()));

    menuItemService.createDish(
        name, description, price, category,
        tags, allergens, calories, ingredients, spiceLevel, status, imageFile
    );

    return "redirect:/menu-items";

  } catch (Exception e) {
    e.printStackTrace();
    throw e;
  }
}
}