package ut.edu.dinio.pojo;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import ut.edu.dinio.pojo.enums.OrderItemStatus;

@Entity
@Table(name = "Ticket_Item")
public class TicketItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TicketItemID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TicketID", nullable = false)
    private KitchenTicket ticket;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrderItemID", nullable = false, unique = true)
    private OrderItem orderItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private OrderItemStatus status = OrderItemStatus.QUEUED;

    public TicketItem() {}

    public TicketItem(KitchenTicket ticket, OrderItem orderItem) {
        this.ticket = ticket;
        this.orderItem = orderItem;
        this.status = OrderItemStatus.QUEUED;
    }

    public Integer getId() { return id; }
    public OrderItemStatus getStatus() { return status; }

    @JsonIgnore
    public KitchenTicket getTicket() { return ticket; }

    @JsonIgnore
    public OrderItem getOrderItem() { return orderItem; }

    public void setId(Integer id) { this.id = id; }
    public void setTicket(KitchenTicket ticket) { this.ticket = ticket; }
    public void setOrderItem(OrderItem orderItem) { this.orderItem = orderItem; }
    public void setStatus(OrderItemStatus status) { this.status = status; }
}
