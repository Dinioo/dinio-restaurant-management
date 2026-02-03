package ut.edu.dinio.repositories;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.SessionStatus;

@Repository
public interface TableSessionRepository extends JpaRepository<TableSession, Integer> {

    Optional<TableSession> findTopByTableIdAndStatusOrderByOpenedAtDesc(Integer tableId, SessionStatus status);

    Optional<TableSession> findTopByTableIdAndStatusInOrderByOpenedAtDesc(
            Integer tableId,
            Collection<SessionStatus> statuses);

    @Query("SELECT ts FROM TableSession ts WHERE ts.table.id = :tableId AND ts.status = :status")
    Optional<TableSession> findByTableIdAndStatus(@Param("tableId") Integer tableId,
            @Param("status") SessionStatus status);

    List<TableSession> findByStatusAndOpenedAtAfter(SessionStatus status, LocalDateTime startOfDay);
}