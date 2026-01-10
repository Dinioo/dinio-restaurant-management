package ut.edu.dinio.pojo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
import ut.edu.dinio.pojo.enums.PaymentMethod;

@Entity
@Table(name = "Payment_Table")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PaymentID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "InvoiceID", nullable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(name = "Method", nullable = false, length = 20)
    private PaymentMethod method;

    @Column(name = "Amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "PaidAt", nullable = false)
    private LocalDateTime paidAt = LocalDateTime.now();

    @Column(name = "RefNo", length = 100, columnDefinition = "NVARCHAR(100)")
    private String refNo;

    public Payment() {}

    public Payment(Invoice invoice, PaymentMethod method, BigDecimal amount, String refNo) {
        this.invoice = invoice;
        this.method = method;
        this.amount = amount;
        this.refNo = refNo;
        this.paidAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public PaymentMethod getMethod() { return method; }
    public BigDecimal getAmount() { return amount; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public String getRefNo() { return refNo; }

    @JsonIgnore
    public Invoice getInvoice() { return invoice; }

    public void setId(Integer id) { this.id = id; }
    public void setInvoice(Invoice invoice) { this.invoice = invoice; }
    public void setMethod(PaymentMethod method) { this.method = method; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    public void setRefNo(String refNo) { this.refNo = refNo; }
}
