package ut.edu.dinio.pojo;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "Audit_Log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AuditLogID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ActorID")
    private StaffUser actor;

    @Column(name = "Action", nullable = false, length = 100, columnDefinition = "NVARCHAR(100)")
    private String action;

    @Column(name = "TargetType", length = 100, columnDefinition = "NVARCHAR(100)")
    private String targetType;

    @Column(name = "TargetId")
    private Integer targetId;

    @Column(name = "Timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "MetadataJson", columnDefinition = "NVARCHAR(MAX)")
    private String metadataJson;

    public AuditLog() {}

    public AuditLog(StaffUser actor, String action, String targetType, Integer targetId, String metadataJson) {
        this.actor = actor;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.metadataJson = metadataJson;
        this.timestamp = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public String getAction() { return action; }
    public String getTargetType() { return targetType; }
    public Integer getTargetId() { return targetId; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getMetadataJson() { return metadataJson; }

    @JsonIgnore
    public StaffUser getActor() { return actor; }

    public void setId(Integer id) { this.id = id; }
    public void setActor(StaffUser actor) { this.actor = actor; }
    public void setAction(String action) { this.action = action; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public void setTargetId(Integer targetId) { this.targetId = targetId; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
}
