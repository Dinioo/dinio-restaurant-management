package ut.edu.dinio.pojo;

import java.math.BigDecimal;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import ut.edu.dinio.pojo.enums.InvoiceStatus;

@Entity
@Table(name = "Invoice_Table")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "InvoiceID")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SessionID", nullable = false, unique = true)
    private TableSession session;

    @Column(name = "Subtotal", precision = 18, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "Tax", precision = 18, scale = 2)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(name = "ServiceCharge", precision = 18, scale = 2)
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    @Column(name = "DiscountTotal", precision = 18, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "Total", precision = 18, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.OPEN;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<InvoiceLine> lines = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Discount> discounts = new ArrayList<>();

    public Invoice() {}

    public Invoice(TableSession session) {
        this.session = session;
    }

    public Integer getId() { return id; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getTax() { return tax; }
    public BigDecimal getServiceCharge() { return serviceCharge; }
    public BigDecimal getDiscountTotal() { return discountTotal; }
    public BigDecimal getTotal() { return total; }
    public InvoiceStatus getStatus() { return status; }

    @JsonIgnore
    public TableSession getSession() { return session; }

    @JsonIgnore
    public List<InvoiceLine> getLines() { return lines; }

    @JsonIgnore
    public List<Payment> getPayments() { return payments; }

    @JsonIgnore
    public List<Discount> getDiscounts() { return discounts; }

    public void setId(Integer id) { this.id = id; }
    public void setSession(TableSession session) { this.session = session; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public void setTax(BigDecimal tax) { this.tax = tax; }
    public void setServiceCharge(BigDecimal serviceCharge) { this.serviceCharge = serviceCharge; }
    public void setDiscountTotal(BigDecimal discountTotal) { this.discountTotal = discountTotal; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public void setStatus(InvoiceStatus status) { this.status = status; }
    public void setLines(List<InvoiceLine> lines) { this.lines = lines; }
    public void setPayments(List<Payment> payments) { this.payments = payments; }
    public void setDiscounts(List<Discount> discounts) { this.discounts = discounts; }
}
