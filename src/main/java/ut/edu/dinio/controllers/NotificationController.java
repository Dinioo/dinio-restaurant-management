package ut.edu.dinio.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.Notification;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.repositories.NotificationRepository;
import ut.edu.dinio.service.NotificationSseService;

@Controller
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationSseService sseService;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/subscribe/{userId}")
    @ResponseBody
    public SseEmitter subscribe(@PathVariable Integer userId) {
        return sseService.subscribe(userId);
    }

    @GetMapping("/list")
    @ResponseBody
    public ResponseEntity<?> getNotifications(HttpSession session) {
        StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
        if (currentStaff == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        List<Notification> notifications = notificationRepository
                .findByRecipientOrderByCreatedAtDesc(currentStaff);

        List<Map<String, Object>> result = notifications.stream().map(n -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("title", n.getTitle());
            map.put("message", n.getMessage());
            map.put("type", n.getType().name());
            map.put("isRead", n.getIsRead());
            map.put("createdAt", n.getCreatedAt().toString());
            map.put("refType", n.getRefType());
            map.put("refId", n.getRefId());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/mark-read")
    @ResponseBody
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null) {
            return ResponseEntity.notFound().build();
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @GetMapping("/unread-count")
    @ResponseBody
    public ResponseEntity<?> getUnreadCount(HttpSession session) {
        StaffUser currentStaff = (StaffUser) session.getAttribute("currentStaff");
        if (currentStaff == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        long count = notificationRepository.countByRecipientAndIsReadFalse(currentStaff);
        return ResponseEntity.ok(Map.of("count", count));
    }
}