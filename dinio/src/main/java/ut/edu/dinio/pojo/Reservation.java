package ut.edu.dinio.pojo;

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
import ut.edu.dinio.pojo.enums.ReservationStatus;

@Entity
@Table(name = "Reservation_Table")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ReservationID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CustomerID", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TableID")
    private DiningTable table;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AreaID")
    private Area area;

    @Column(name = "ReservedAt", nullable = false)
    private LocalDateTime reservedAt;

    @Column(name = "PartySize", nullable = false)
    private Integer partySize;

    @Column(name = "Note", length = 500, columnDefinition = "NVARCHAR(500)")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 30)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Reservation() {}

    public Reservation(Customer customer, LocalDateTime reservedAt, Integer partySize, String note) {
        this.customer = customer;
        this.reservedAt = reservedAt;
        this.partySize = partySize;
        this.note = note;
    }

    public Integer getId() { return id; }
    public LocalDateTime getReservedAt() { return reservedAt; }
    public Integer getPartySize() { return partySize; }
    public String getNote() { return note; }
    public ReservationStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    @JsonIgnore
    public Customer getCustomer() { return customer; }

    @JsonIgnore
    public DiningTable getTable() { return table; }

    @JsonIgnore
    public Area getArea() { return area; }

    public void setId(Integer id) { this.id = id; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public void setTable(DiningTable table) { this.table = table; }
    public void setArea(Area area) { this.area = area; }
    public void setReservedAt(LocalDateTime reservedAt) { this.reservedAt = reservedAt; }
    public void setPartySize(Integer partySize) { this.partySize = partySize; }
    public void setNote(String note) { this.note = note; }
    public void setStatus(ReservationStatus status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
