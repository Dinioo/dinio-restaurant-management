package ut.edu.dinio.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.MenuCategory;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.enums.ItemTag;
import ut.edu.dinio.repositories.MenuCategoryRepository;
import ut.edu.dinio.repositories.MenuItemRepository;

@Service
public class MenuViewService {

    private final MenuCategoryRepository categoryRepo;
    private final MenuItemRepository itemRepo;

    public MenuViewService(MenuCategoryRepository categoryRepo, MenuItemRepository itemRepo) {
        this.categoryRepo = categoryRepo;
        this.itemRepo = itemRepo;
    }

    public MenuPageData getMenuPageData(String q, Integer catId, String tag, String sort) {
        String qNorm = norm(q);
        ItemTag tagEnum = parseTag(tag);

        List<MenuCategory> categories = categoryRepo.findAllByOrderBySortOrderAscNameAsc();

        List<MenuItem> items = itemRepo.findActiveAvailableWithCategory();

        if (catId != null) {
            items = items.stream()
                .filter(i -> i.getCategory() != null && Objects.equals(i.getCategory().getId(), catId))
                .collect(Collectors.toList());
        }

        if (tagEnum != null) {
            items = items.stream()
                .filter(i -> i.getItemTags() != null && i.getItemTags().contains(tagEnum))
                .collect(Collectors.toList());
        }

        if (!qNorm.isBlank()) {
            items = items.stream()
                .filter(i -> {
                    String hay = (safe(i.getName()) + " " + safe(i.getDescription()) + " " + safe(i.getIngredients()))
                        .toLowerCase();
                    return hay.contains(qNorm);
                })
                .collect(Collectors.toList());
        }

        String mode = (sort == null || sort.isBlank()) ? "recommended" : sort.toLowerCase();
        Comparator<MenuItem> cmp;

        if ("low".equals(mode)) {
            cmp = Comparator.comparing(MenuItem::getBasePrice, Comparator.nullsLast(Comparator.naturalOrder()));
        } else if ("high".equals(mode)) {
            cmp = Comparator.comparing(MenuItem::getBasePrice, Comparator.nullsLast(Comparator.reverseOrder()));
        } else if ("newest".equals(mode)) {
            cmp = Comparator.comparing(MenuItem::getId, Comparator.nullsLast(Comparator.reverseOrder()));
        } else {
            cmp = Comparator
                .comparing((MenuItem i) -> i.getCategory() != null ? safeInt(i.getCategory().getSortOrder()) : 9999)
                .thenComparing(MenuItem::getId, Comparator.nullsLast(Comparator.naturalOrder()));
        }
        items.sort(cmp);

        Map<Integer, List<MenuItem>> itemsByCategory = new LinkedHashMap<>();
        for (MenuCategory c : categories) itemsByCategory.put(c.getId(), new ArrayList<>());

        for (MenuItem it : items) {
            if (it.getCategory() == null) continue;
            itemsByCategory.computeIfAbsent(it.getCategory().getId(), k -> new ArrayList<>()).add(it);
        }

        return new MenuPageData(categories, itemsByCategory, items.size(), q == null ? "" : q, catId, tag, mode);
    }

    private static ItemTag parseTag(String tag) {
        if (tag == null || tag.isBlank()) 
            return null;
        try { 
            return ItemTag.valueOf(tag.trim().toUpperCase()); }
        catch (Exception e) { 
            return null; }
    }

    private static String norm(String s) { 
        return s == null ? "" : s.trim().toLowerCase(); }
    private static String safe(String s) { 
        return s == null ? "" : s; }
    private static int safeInt(Integer i) { 
        return i == null ? 9999 : i; }

    public static class MenuPageData {
        public final List<MenuCategory> categories;
        public final Map<Integer, List<MenuItem>> itemsByCategory;
        public final int totalCount;
        public final String q;
        public final Integer cat;
        public final String tag;
        public final String sort;

        public MenuPageData(List<MenuCategory> categories,
                            Map<Integer, List<MenuItem>> itemsByCategory,
                            int totalCount,
                            String q, Integer cat, String tag, String sort) {
            this.categories = categories;
            this.itemsByCategory = itemsByCategory;
            this.totalCount = totalCount;
            this.q = q;
            this.cat = cat;
            this.tag = tag;
            this.sort = sort;
        }
    }
}
