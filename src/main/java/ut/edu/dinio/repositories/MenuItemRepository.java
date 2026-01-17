package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.MenuItem;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {
    
    // Query đơn giản để lấy tất cả món active
    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true AND m.isAvailable = true")
    List<MenuItem> findAllActiveItems();
    
    // Query native SQL để lấy món yêu thích (có tag BEST hoặc SIGNATURE)
    @Query(value = "SELECT DISTINCT m.* FROM menu_item m " +
                   "INNER JOIN menu_item_tags t ON m.menu_itemid = t.menu_itemid " +
                   "WHERE (t.item_tag = 'BEST' OR t.item_tag = 'SIGNATURE') " +
                   "AND m.is_active = 1 AND m.is_available = 1 " +
                   "ORDER BY m.menu_itemid", 
           nativeQuery = true)
    List<MenuItem> findFavoriteItems();
    
    // Backup method đơn giản
    List<MenuItem> findByIsActiveTrueAndIsAvailableTrue();
}