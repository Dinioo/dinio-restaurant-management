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
import ut.edu.dinio.pojo.enums.TicketStatus;

@Entity
@Table(name = "Kitchen_Ticket")
public class KitchenTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TicketID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SessionID", nullable = false)
    private TableSession session;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrderID", nullable = false, unique = true)
    private Order order;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private TicketStatus status = TicketStatus.OPEN;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TicketItem> items = new ArrayList<>();

    public KitchenTicket() {}

    public KitchenTicket(TableSession session, Order order) {
        this.session = session;
        this.order = order;
        this.createdAt = LocalDateTime.now();
        this.status = TicketStatus.OPEN;
    }

    public Integer getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public TicketStatus getStatus() { return status; }

    @JsonIgnore
    public TableSession getSession() { return session; }

    @JsonIgnore
    public Order getOrder() { return order; }

    @JsonIgnore
    public List<TicketItem> getItems() { return items; }

    public void setId(Integer id) { this.id = id; }
    public void setSession(TableSession session) { this.session = session; }
    public void setOrder(Order order) { this.order = order; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public void setItems(List<TicketItem> items) { this.items = items; }
}
