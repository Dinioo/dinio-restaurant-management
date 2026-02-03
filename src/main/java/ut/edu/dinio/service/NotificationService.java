package ut.edu.dinio.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.Notification;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.enums.NotificationType;
import ut.edu.dinio.pojo.enums.RoleName;
import ut.edu.dinio.repositories.NotificationRepository;
import ut.edu.dinio.repositories.StaffUserRepository;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private StaffUserRepository staffUserRepository;
    @Autowired
    private NotificationSseService sseService;

    public void notifyWaiter(StaffUser waiter, String title, String message, Integer sessionId) {
        System.out.println("DEBUG NotificationService: notifyWaiter called");
        System.out.println("  - Waiter ID: " + waiter.getId());
        System.out.println("  - Title: " + title);
        System.out.println("  - SessionId: " + sessionId);
        saveAndPush(waiter, NotificationType.TICKET_READY, title, message, "TABLE_SESSION", sessionId);
        System.out.println("DEBUG NotificationService: Notification saved!");
    }

    public void notifyKitchen(String title, String message, Integer orderId) {
        List<StaffUser> kitchenStaff = staffUserRepository.findByRoleName(RoleName.KITCHEN);
        for (StaffUser staff : kitchenStaff) {
            saveAndPush(staff, NotificationType.ORDER_SENT_TO_KITCHEN, title, message, "ORDER", orderId);
        }
    }

    public void notifyCashier(String title, String message, Integer tableId) {
        List<StaffUser> cashierStaff = staffUserRepository.findByRoleName(RoleName.CASHIER_MANAGER);
        for (StaffUser staff : cashierStaff) {
            saveAndPush(staff, NotificationType.PAYMENT_REQUESTED, title, message, "TABLE", tableId);
        }
    }

    public void notifyWaiterPaymentComplete(StaffUser waiter, String title, String message, Integer tableId) {
        saveAndPush(waiter, NotificationType.PAYMENT_RECEIVED, title, message, "TABLE", tableId);
    }

    public void notifyKitchenPreorder(String title, String message, Integer reservationId) {
        List<StaffUser> kitchenStaff = staffUserRepository.findByRoleName(RoleName.KITCHEN);
        for (StaffUser staff : kitchenStaff) {
            saveAndPush(staff, NotificationType.NEW_RESERVATION, title, message, "RESERVATION", reservationId);
        }
    }

    public void notifyCashierNewReservation(String title, String message, Integer reservationId) {
        List<StaffUser> cashierStaff = staffUserRepository.findByRoleName(RoleName.CASHIER_MANAGER);
        for (StaffUser staff : cashierStaff) {
            saveAndPush(staff, NotificationType.NEW_RESERVATION, title, message, "RESERVATION", reservationId);
        }
    }

    private void saveAndPush(StaffUser recipient, NotificationType type, String title, 
                             String message, String refType, Integer refId) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setRefType(refType);
        n.setRefId(refId);
        n.setCreatedAt(LocalDateTime.now());
        n.setIsRead(false);
        
        notificationRepository.save(n);
        
        sseService.sendRealtime(recipient.getId(), n);
    }
}

