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
import ut.edu.dinio.pojo.enums.DiscountScope;
import ut.edu.dinio.pojo.enums.DiscountType;

@Entity
@Table(name = "Discount_Table")
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DiscountID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "InvoiceID", nullable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 20)
    private DiscountType type;

    @Column(name = "Value", nullable = false, precision = 18, scale = 2)
    private BigDecimal value = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "Scope", nullable = false, length = 20)
    private DiscountScope scope = DiscountScope.BILL;

    @Column(name = "Reason", length = 255, columnDefinition = "NVARCHAR(255)")
    private String reason;

    public Discount() {}

    public Discount(Invoice invoice, DiscountType type, BigDecimal value, String reason) {
        this.invoice = invoice;
        this.type = type;
        this.value = value;
        this.reason = reason;
        this.scope = DiscountScope.BILL;
    }

    public Integer getId() { return id; }
    public DiscountType getType() { return type; }
    public BigDecimal getValue() { return value; }
    public DiscountScope getScope() { return scope; }
    public String getReason() { return reason; }

    @JsonIgnore
    public Invoice getInvoice() { return invoice; }

    public void setId(Integer id) { this.id = id; }
    public void setInvoice(Invoice invoice) { this.invoice = invoice; }
    public void setType(DiscountType type) { this.type = type; }
    public void setValue(BigDecimal value) { this.value = value; }
    public void setScope(DiscountScope scope) { this.scope = scope; }
    public void setReason(String reason) { this.reason = reason; }
}
