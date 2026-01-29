package ut.edu.dinio.pojo;

import java.math.BigDecimal;

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
import ut.edu.dinio.pojo.enums.OrderItemStatus;

@Entity
@Table(name = "Order_Item")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "OrderItemID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrderID", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MenuItemID", nullable = false)
    private MenuItem menuItem;

    @Column(name = "Qty", nullable = false)
    private Integer qty;

    @Column(name = "UnitPrice", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "Note", length = 500, columnDefinition = "NVARCHAR(500)")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private OrderItemStatus status = OrderItemStatus.DRAFT;

    public OrderItem() {}

    public OrderItem(Order order, MenuItem menuItem, Integer qty, BigDecimal unitPrice, String note) {
        this.order = order;
        this.menuItem = menuItem;
        this.qty = qty;
        this.unitPrice = unitPrice;
        this.note = note;
    }

    public Integer getId() { return id; }
    public Integer getQty() { return qty; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public String getNote() { return note; }
    public OrderItemStatus getStatus() { return status; }

    @JsonIgnore
    public Order getOrder() { return order; }

    @JsonIgnore
    public MenuItem getMenuItem() { return menuItem; }

    public void setId(Integer id) { this.id = id; }
    public void setOrder(Order order) { this.order = order; }
    public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }
    public void setQty(Integer qty) { this.qty = qty; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public void setNote(String note) { this.note = note; }
    public void setStatus(OrderItemStatus status) { this.status = status; }
}
