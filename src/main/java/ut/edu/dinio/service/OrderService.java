package ut.edu.dinio.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.KitchenTicket;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.Order;
import ut.edu.dinio.pojo.OrderItem;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.OrderItemStatus;
import ut.edu.dinio.pojo.enums.OrderStatus;
import ut.edu.dinio.pojo.enums.TicketStatus;
import ut.edu.dinio.repositories.KitchenTicketRepository;
import ut.edu.dinio.repositories.MenuItemRepository;
import ut.edu.dinio.repositories.OrderItemRepository;
import ut.edu.dinio.repositories.OrderRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final KitchenTicketRepository kitchenTicketRepository;
    private final MenuItemRepository menuItemRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            KitchenTicketRepository kitchenTicketRepository,
            MenuItemRepository menuItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.kitchenTicketRepository = kitchenTicketRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public KitchenTicket sendToKitchen(
            TableSession session,
            List<Map<String, Object>> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Chưa có món để gửi bếp");
        }

        Order order = new Order();
        order.setSession(session);
        order.setStatus(OrderStatus.SENT);
        order = orderRepository.save(order);

        for (Map<String, Object> it : items) {
            Integer menuItemId = Integer.valueOf(it.get("menuItemId").toString());
            Integer qty = Integer.valueOf(it.get("qty").toString());
            String note = (String) it.get("note");

            MenuItem mi = menuItemRepository.findById(menuItemId)
                    .orElseThrow(() -> new RuntimeException("MenuItem not found"));

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setMenuItem(mi);
            oi.setQty(qty);
            oi.setUnitPrice(mi.getBasePrice());
            oi.setStatus(OrderItemStatus.QUEUED);
            oi.setNote(note);

            orderItemRepository.save(oi);
        }

        KitchenTicket ticket = new KitchenTicket();
        ticket.setSession(session);
        ticket.setOrder(order);
        ticket.setStatus(TicketStatus.OPEN);
        return kitchenTicketRepository.save(ticket);
    }
}
