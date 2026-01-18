package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ut.edu.dinio.pojo.MenuCategory;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Integer> {
    List<MenuCategory> findAllByOrderBySortOrderAscNameAsc();
}
