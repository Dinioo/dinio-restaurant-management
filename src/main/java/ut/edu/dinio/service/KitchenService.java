package ut.edu.dinio.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ut.edu.dinio.pojo.OrderItem;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.OrderItemStatus;
import ut.edu.dinio.repositories.OrderItemRepository;

@Service
public class KitchenService {

    @Autowired
    private OrderItemRepository orderItemRepo;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    public List<Map<String, Object>> getKitchenOrders() {
        List<OrderItemStatus> activeStatuses = Arrays.asList(
                OrderItemStatus.QUEUED,
                OrderItemStatus.PREPARING,
                OrderItemStatus.READY,
                OrderItemStatus.SERVED,
                OrderItemStatus.CANCELLED);
        List<OrderItem> items = orderItemRepo.findKitchenItems(activeStatuses);

        List<Map<String, Object>> result = new ArrayList<>();
        for (OrderItem oi : items) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", oi.getId());
            map.put("name", oi.getMenuItem().getName());
            map.put("qty", oi.getQty());
            map.put("note", oi.getNote());
            map.put("status", oi.getStatus().name());
            map.put("createdAt", oi.getOrder().getCreatedAt());
            map.put("tableCode", oi.getOrder().getSession().getTable().getCode());
            map.put("categoryName", oi.getMenuItem().getCategory().getName());
            result.add(map);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> updateNextStatus(Integer orderItemId, StaffUser staff) {
        OrderItem item = orderItemRepo.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

        OrderItemStatus current = item.getStatus();
        OrderItemStatus next;

        switch (current) {
            case QUEUED:
                next = OrderItemStatus.PREPARING;
                break;
            case PREPARING:
                next = OrderItemStatus.READY;
                break;
            case READY:
                next = OrderItemStatus.SERVED;
                break;
            case CANCELLED:
                next = OrderItemStatus.CANCELLED;
                break;
            default:
                next = current;
        }

        item.setStatus(next);
        orderItemRepo.save(item);

        System.out.println("DEBUG: Trang thai tiep theo la: " + next.name()); 

    if (next.name().equals("READY")) {
        System.out.println("DEBUG: Dang vao luong gui thong bao cho Waiter...");
        TableSession session = item.getOrder().getSession();
        
        if (session.getAssignedStaff() != null) {
            System.out.println("DEBUG: Gui cho Waiter ID: " + session.getAssignedStaff().getId());
            notificationService.notifyWaiter(
                session.getAssignedStaff(), 
                "Món ăn đã sẵn sàng", 
                "Món '" + item.getMenuItem().getName() + "' của bàn " + session.getTable().getCode() + " đã xong.", 
                session.getId()
            );
        } else {
            System.out.println("DEBUG: Khong tim thay AssignedStaff cho session nay!");
        }
    }

        auditLogService.log(
                staff,
                "UPDATE_ORDER_ITEM_STATUS",
                "OrderItem",
                item.getId(),
                Map.of("from", current.name(), "to", next.name()));

        Map<String, Object> res = new HashMap<>();
        res.put("id", item.getId());
        res.put("status", next.name());
        return res;
    }
}