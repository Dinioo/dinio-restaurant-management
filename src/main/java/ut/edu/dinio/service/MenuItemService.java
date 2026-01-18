package ut.edu.dinio.service;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ut.edu.dinio.pojo.MenuCategory;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.enums.AllergyTag;
import ut.edu.dinio.pojo.enums.ItemTag;
import ut.edu.dinio.pojo.enums.SpiceLevel;
import ut.edu.dinio.repositories.MenuCategoryRepository;
import ut.edu.dinio.repositories.MenuItemRepository;

@Service
public class MenuItemService {

  private final MenuItemRepository menuItemRepository;
  private final MenuCategoryRepository menuCategoryRepository;
  private final CloudinaryStorageService cloudinaryStorageService;

  public MenuItemService(MenuItemRepository menuItemRepository,
                         MenuCategoryRepository menuCategoryRepository,
                         CloudinaryStorageService cloudinaryStorageService) {
    this.menuItemRepository = menuItemRepository;
    this.menuCategoryRepository = menuCategoryRepository;
    this.cloudinaryStorageService = cloudinaryStorageService;
  }

  @Transactional
  public MenuItem createDish(String name,
                             String description,
                             Long priceVnd,
                             Integer categoryId,
                             List<String> tags,
                             List<String> allergens,
                             Integer calories,
                             String ingredients,
                             String spiceLevel,
                             String status,
                             MultipartFile imageFile) {

    MenuCategory category = menuCategoryRepository.findById(categoryId)
        .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));

    // Upload Cloudinary -> URL
    String imageUrl = cloudinaryStorageService.uploadImage(imageFile, "dinio/menu");

    // Map tags
    Set<ItemTag> itemTags = new HashSet<>();
    if (tags != null) {
      for (String t : tags) {
        ItemTag e = parseEnum(ItemTag.class, t);
        if (e != null) itemTags.add(e);
      }
    }

    // Map allergens
    Set<AllergyTag> allergyTags = new HashSet<>();
    if (allergens != null) {
      for (String a : allergens) {
        AllergyTag e = parseEnum(AllergyTag.class, a);
        if (e != null) allergyTags.add(e);
      }
    }

    // Map spice level (form: none/mild/medium/hot)
    SpiceLevel sp = parseSpice(spiceLevel);

    // Map status (available/soldout/hidden)
    boolean isActive = true;
    boolean isAvailable = true;
    if (status != null) {
      String s = status.trim().toLowerCase();
      if ("soldout".equals(s)) {
        isActive = true; isAvailable = false;
      } else if ("hidden".equals(s)) {
        isActive = false; isAvailable = false;
      }
    }

    MenuItem item = new MenuItem();
    item.setCategory(category);
    item.setName(name);
    item.setDescription(description == null ? "" : description);
    item.setIngredients(ingredients);
    item.setCalories(calories);
    item.setSpiceLevel(sp);
    item.setBasePrice(BigDecimal.valueOf(priceVnd == null ? 0 : priceVnd));
    item.setImageUrl(imageUrl);

    item.setItemTags(itemTags);
    item.setAllergyTags(allergyTags);

    item.setIsActive(isActive);
    item.setIsAvailable(isAvailable);

    return menuItemRepository.save(item);
  }

  private static SpiceLevel parseSpice(String spiceLevel) {
    if (spiceLevel == null || spiceLevel.isBlank()) return SpiceLevel.NOT_SPICY;
    String s = spiceLevel.trim().toUpperCase();
    if ("NONE".equals(s)) return SpiceLevel.NOT_SPICY;
    try { return SpiceLevel.valueOf(s); }
    catch (Exception e) { return SpiceLevel.NOT_SPICY; }
  }

  private static <E extends Enum<E>> E parseEnum(Class<E> enumClass, String raw) {
    if (raw == null || raw.isBlank()) return null;
    String key = raw.trim().toUpperCase().replace("-", "_").replace(" ", "_");
    try { return Enum.valueOf(enumClass, key); }
    catch (Exception e) { return null; }
  }
}
