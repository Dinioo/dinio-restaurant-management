package ut.edu.dinio.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.enums.TableStatus;

@Repository
public interface DiningTableRepository extends JpaRepository<DiningTable, Integer> {
    List<DiningTable> findByAreaId(Integer areaId);
    List<DiningTable> findByStatus(TableStatus status);
    Optional<DiningTable> findByCode(String code);
    List<DiningTable> findAllByOrderByAreaIdAscCodeAsc();
}