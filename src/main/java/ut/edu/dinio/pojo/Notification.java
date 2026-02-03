package ut.edu.dinio.pojo;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import ut.edu.dinio.pojo.enums.NotificationType;

@Entity
@Table(name = "Notification_Table")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NotificationID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RecipientID", nullable = false)
    private StaffUser recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ActorID")
    private StaffUser actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 50)
    private NotificationType type = NotificationType.SYSTEM;

    @Column(name = "Title", nullable = false, length = 120, columnDefinition = "NVARCHAR(120)")
    private String title;

    @Column(name = "Message", nullable = false, length = 500, columnDefinition = "NVARCHAR(500)")
    private String message;

    @Column(name = "RefType", length = 50, columnDefinition = "NVARCHAR(50)")
    private String refType; 

    @Column(name = "RefId")
    private Integer refId;

    @Column(name = "IsRead", nullable = false)
    private Boolean isRead = false;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(StaffUser recipient, StaffUser actor, NotificationType type,
                        String title, String message, String refType, Integer refId, String linkUrl) {
        this.recipient = recipient;
        this.actor = actor;
        this.type = (type == null ? NotificationType.SYSTEM : type);
        this.title = title;
        this.message = message;
        this.refType = refType;
        this.refId = refId;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public NotificationType getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getRefType() { return refType; }
    public Integer getRefId() { return refId; }
    public Boolean getIsRead() { return isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    @JsonIgnore
    public StaffUser getRecipient() { return recipient; }

    @JsonIgnore
    public StaffUser getActor() { return actor; }

    public void setId(Integer id) { this.id = id; }
    public void setRecipient(StaffUser recipient) { this.recipient = recipient; }
    public void setActor(StaffUser actor) { this.actor = actor; }
    public void setType(NotificationType type) { this.type = type; }
    public void setTitle(String title) { this.title = title; }
    public void setMessage(String message) { this.message = message; }
    public void setRefType(String refType) { this.refType = refType; }
    public void setRefId(Integer refId) { this.refId = refId; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public void markRead() {
        this.isRead = true;
    }
}
