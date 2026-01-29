package ut.edu.dinio.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Area;

@Repository
public interface AreaRepository extends JpaRepository<Area, Integer> {
    Optional<Area> findByName(String name);
    List<Area> findAllByOrderByIdAsc();
}