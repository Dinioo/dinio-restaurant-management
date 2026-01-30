package ut.edu.dinio.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import ut.edu.dinio.pojo.AuditLog;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.repositories.AuditLogRepository;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(StaffUser actor, String action, String targetType, Integer targetId, Map<String, Object> metadata) {
        try {
            String metaJson = (metadata == null) ? null : objectMapper.writeValueAsString(metadata);
            AuditLog log = new AuditLog(actor, action, targetType, targetId, metaJson);
            log.setTimestamp(LocalDateTime.now());
            auditLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }

    public void log(StaffUser actor, String action, String targetType, Integer targetId) {
        log(actor, action, targetType, targetId, null);
    }
}