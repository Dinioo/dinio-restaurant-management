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
import ut.edu.dinio.pojo.enums.OrderItemStatus;
import ut.edu.dinio.repositories.OrderItemRepository;

@Service
public class KitchenService {

    @Autowired
    private OrderItemRepository orderItemRepo;

    public List<Map<String, Object>> getKitchenOrders() {
        List<OrderItemStatus> activeStatuses = Arrays.asList(
            OrderItemStatus.QUEUED, 
            OrderItemStatus.PREPARING, 
            OrderItemStatus.READY,
            OrderItemStatus.SERVED,
            OrderItemStatus.CANCELLED
        );
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
    public Map<String, Object> updateNextStatus(Integer orderItemId) {
        OrderItem item = orderItemRepo.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));
        
        OrderItemStatus current = item.getStatus();
        OrderItemStatus next;

        switch (current) {
            case QUEUED: next = OrderItemStatus.PREPARING; break;
            case PREPARING: next = OrderItemStatus.READY; break;
            case READY: next = OrderItemStatus.SERVED; break;
            case CANCELLED:next = OrderItemStatus.CANCELLED;break;
            default: next = current;
        }

        item.setStatus(next);
        orderItemRepo.save(item);

        Map<String, Object> res = new HashMap<>();
        res.put("id", item.getId());
        res.put("status", next.name());
        return res;
    }
}