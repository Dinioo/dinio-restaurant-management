package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Notification;
import ut.edu.dinio.pojo.StaffUser;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    List<Notification> findByRecipientOrderByCreatedAtDesc(StaffUser recipient);
    
    long countByRecipientAndIsReadFalse(StaffUser recipient);
    
    List<Notification> findByRefTypeAndRefId(String refType, Integer refId);
}

