package ut.edu.dinio.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.enums.ItemTag;
import ut.edu.dinio.repositories.MenuItemRepository;

@Service
public class MenuItemService {

    @Autowired
    private MenuItemRepository menuItemRepository;

    /**
     * Lấy danh sách món ăn được yêu thích (có tag BEST hoặc SIGNATURE)
     * @return List<MenuItem>
     */
    public List<MenuItem> getFavoriteItems() {
        try {
            // Thử query native SQL
            List<MenuItem> items = menuItemRepository.findFavoriteItems();
            if (items != null && !items.isEmpty()) {
                return items;
            }
        } catch (Exception e) {
            System.out.println("Error in findFavoriteItems: " + e.getMessage());
        }
        
        try {
            // Fallback: lấy tất cả rồi filter
            return menuItemRepository.findByIsActiveTrueAndIsAvailableTrue()
                .stream()
                .filter(item -> item.getItemTags() != null && 
                               !item.getItemTags().isEmpty() &&
                               (item.getItemTags().contains(ItemTag.BEST) || 
                                item.getItemTags().contains(ItemTag.SIGNATURE)))
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.out.println("Error in backup method: " + e.getMessage());
            // Trả về danh sách rỗng thay vì crash
            return List.of();
        }
    }

    /**
     * Lấy tất cả món ăn đang hoạt động
     * @return List<MenuItem>
     */
    public List<MenuItem> getAllActiveItems() {
        try {
            return menuItemRepository.findAllActiveItems();
        } catch (Exception e) {
            System.out.println("Error in getAllActiveItems: " + e.getMessage());
            return menuItemRepository.findAll(); // Fallback cuối cùng
        }
    }
}