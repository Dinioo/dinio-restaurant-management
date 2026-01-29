package ut.edu.dinio.pojo;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "Invoice_Line")
public class InvoiceLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "InvoiceLineID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "InvoiceID", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrderItemID", nullable = false)
    private OrderItem orderItem;

    @Column(name = "Qty", nullable = false)
    private Integer qty;

    @Column(name = "Price", nullable = false, precision = 18, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    public InvoiceLine() {}

    public InvoiceLine(Invoice invoice, OrderItem orderItem, Integer qty, BigDecimal price) {
        this.invoice = invoice;
        this.orderItem = orderItem;
        this.qty = qty;
        this.price = price;
    }

    public Integer getId() { return id; }
    public Integer getQty() { return qty; }
    public BigDecimal getPrice() { return price; }

    @JsonIgnore
    public Invoice getInvoice() { return invoice; }

    @JsonIgnore
    public OrderItem getOrderItem() { return orderItem; }

    public void setId(Integer id) { this.id = id; }
    public void setInvoice(Invoice invoice) { this.invoice = invoice; }
    public void setOrderItem(OrderItem orderItem) { this.orderItem = orderItem; }
    public void setQty(Integer qty) { this.qty = qty; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
