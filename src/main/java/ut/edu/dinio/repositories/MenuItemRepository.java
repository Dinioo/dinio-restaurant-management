package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.MenuItem;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {

    @Query("""
        select mi
        from MenuItem mi
        join fetch mi.category c
        where mi.isActive = true and mi.isAvailable = true
        """)
    List<MenuItem> findActiveAvailableWithCategory();

    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true AND m.isAvailable = true")
    List<MenuItem> findAllActiveItems();
    
    @Query(value = "SELECT DISTINCT m.* FROM menu_item m " +
                   "INNER JOIN menu_item_tags t ON m.menu_itemid = t.menu_itemid " +
                   "WHERE (t.item_tag = 'BEST' OR t.item_tag = 'SIGNATURE') " +
                   "AND m.is_active = 1 AND m.is_available = 1 " +
                   "ORDER BY m.menu_itemid", 
           nativeQuery = true)
    List<MenuItem> findFavoriteItems();
    
    List<MenuItem> findByIsActiveTrueAndIsAvailableTrue();
}
