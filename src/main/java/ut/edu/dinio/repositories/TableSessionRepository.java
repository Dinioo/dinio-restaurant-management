package ut.edu.dinio.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.SessionStatus;

@Repository
public interface TableSessionRepository extends JpaRepository<TableSession, Integer> {
    Optional<TableSession> findByTableIdAndStatus(Integer tableId, SessionStatus status);
}