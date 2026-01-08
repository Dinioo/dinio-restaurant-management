package ut.edu.dinio.pojo;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import ut.edu.dinio.pojo.enums.OrderStatus;

@Entity
@Table(name = "Order_Table")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "OrderID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SessionID", nullable = false)
    private TableSession session;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CreatedBy")
    private StaffUser createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private OrderStatus status = OrderStatus.DRAFT;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", fetch = FetchType.LAZY)
    private KitchenTicket kitchenTicket;

    public Order() {}

    public Order(TableSession session, StaffUser createdBy) {
        this.session = session;
        this.createdBy = createdBy;
        this.createdAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public OrderStatus getStatus() { return status; }

    @JsonIgnore
    public TableSession getSession() { return session; }

    @JsonIgnore
    public StaffUser getCreatedBy() { return createdBy; }

    @JsonIgnore
    public List<OrderItem> getItems() { return items; }

    @JsonIgnore
    public KitchenTicket getKitchenTicket() { return kitchenTicket; }

    public void setId(Integer id) { this.id = id; }
    public void setSession(TableSession session) { this.session = session; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setCreatedBy(StaffUser createdBy) { this.createdBy = createdBy; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public void setKitchenTicket(KitchenTicket kitchenTicket) { this.kitchenTicket = kitchenTicket; }
}
