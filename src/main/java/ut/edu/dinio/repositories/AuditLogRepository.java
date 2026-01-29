package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ut.edu.dinio.pojo.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    List<AuditLog> findTop100ByOrderByTimestampDesc();
}
