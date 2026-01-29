package ut.edu.dinio.controllers;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import ut.edu.dinio.pojo.MenuCategory;
import ut.edu.dinio.pojo.MenuItem;
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

  @GetMapping("/preorder")
  public String preorderPage() {
    return "customer/preorder";
  }


  @GetMapping("/reservation")
  public String reservation() {
    return "customer/reservation";
  }

  @GetMapping("/api/menu/page-data")
  @ResponseBody
  public ResponseEntity<?> menuPageData(
      @RequestParam(value = "q", required = false) String q,
      @RequestParam(value = "cat", required = false) String catParam,
      @RequestParam(value = "tag", required = false) String tag,
      @RequestParam(value = "sort", required = false) String sort,
      @RequestParam(value = "view", required = false, defaultValue = "customer") String view
  ) {
    Integer cat = resolveCategoryId(catParam);
  Integer initialCatId = resolveCategoryId(catParam);

  Integer filterCatId = null;

    var data = menuViewService.getMenuPageData(q, filterCatId, tag, sort);

    boolean isCustomer = "customer".equalsIgnoreCase(view);

    Map<String, Object> res = new HashMap<>();

    res.put("cat", initialCatId);   

    res.put("categories", data.categories.stream()
        .map(c -> Map.<String, Object>of(
            "id", c.getId(),
            "name", c.getName()
        ))
        .collect(Collectors.toList()));

    res.put("tags", Arrays.stream(ItemTag.values())
        .map(t -> t.name().toLowerCase())
        .collect(Collectors.toList()));

    List<Map<String, Object>> items = data.itemsByCategory.entrySet().stream()
        .flatMap(e -> {
          Integer categoryId = e.getKey();
          List<MenuItem> list = e.getValue();
          if (list == null) return java.util.stream.Stream.empty();

          return list.stream()
              .filter(it -> !isCustomer || (Boolean.TRUE.equals(it.getIsActive()) && Boolean.TRUE.equals(it.getIsAvailable())))
              .map(it -> {
                List<String> tagsList = (it.getItemTags() == null) ? List.of()
                    : it.getItemTags().stream().map(t -> t.name().toLowerCase()).collect(Collectors.toList());

                List<String> allergensList = (it.getAllergyTags() == null) ? List.of()
                    : it.getAllergyTags().stream().map(a -> a.name().toLowerCase()).collect(Collectors.toList());

                Map<String, Object> m = new HashMap<>();
                m.put("id", it.getId());
                m.put("categoryId", categoryId);

                m.put("name", it.getName());
                m.put("description", it.getDescription());
                m.put("price", it.getBasePrice());
                m.put("imageUrl", it.getImageUrl());

                m.put("ingredients", it.getIngredients());
                m.put("calories", it.getCalories());
                m.put("spiceLevel", it.getSpiceLevel() == null ? null : it.getSpiceLevel().name().toLowerCase());

                m.put("isActive", it.getIsActive());
                m.put("isAvailable", it.getIsAvailable());

                m.put("tags", tagsList);
                m.put("allergens", allergensList);
                m.put("isNew", tagsList.contains("new"));

                return m;
              });
        })
        .collect(Collectors.toList());

    res.put("items", items);

    res.put("q", q == null ? "" : q.trim());
    res.put("cat", cat);
    res.put("tag", tag == null ? null : tag.trim().toLowerCase());
    res.put("sort", sort == null ? "recommended" : sort);
    res.put("view", view);
    res.put("totalCount", data.totalCount);

    return ResponseEntity.ok(res);
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
    menuItemService.createDish(
        name, description, price, category,
        tags, allergens, calories, ingredients, spiceLevel, status, imageFile
    );
    return "redirect:/menu-items";
  }

  private Integer resolveCategoryId(String catParam) {
  if (catParam == null || catParam.trim().isEmpty()) 
    return null;

  String raw = catParam.trim();

  try {
    return Integer.valueOf(raw);
  } catch (NumberFormatException ignored) {}

  String slug = raw.toLowerCase();

  return menuCategoryRepository.findAllByOrderBySortOrderAscNameAsc()
      .stream()
      .filter(c -> {
        String nameSlug = c.getName() == null ? "" : c.getName().toLowerCase().replaceAll("[^a-z0-9]+", "");
        if (slug.equals("starter")) 
          return nameSlug.contains("starter");
        if (slug.equals("main"))    
          return nameSlug.contains("main");
        if (slug.equals("dessert")) 
          return nameSlug.contains("dessert");
        if (slug.equals("drink"))   
          return nameSlug.contains("drink");
        return nameSlug.contains(slug);
      })
      .map(MenuCategory::getId)
      .findFirst()
      .orElse(null);
}

}
