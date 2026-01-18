package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import ut.edu.dinio.pojo.MenuItem;

public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {

    @Query("""
        select mi
        from MenuItem mi
        join fetch mi.category c
        where mi.isActive = true and mi.isAvailable = true
        """)
    List<MenuItem> findActiveAvailableWithCategory();
}
