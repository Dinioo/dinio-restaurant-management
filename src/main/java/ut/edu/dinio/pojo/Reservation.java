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

    @Column(name = "IsForOther", nullable = false)
    private Boolean isForOther = false;

    @Column(name = "GuestName", length = 120, columnDefinition = "NVARCHAR(120)")
    private String guestName;  

    @Column(name = "GuestPhone", length = 30, columnDefinition = "NVARCHAR(30)")
    private String guestPhone; 

    @Column(name = "GuestNote", length = 500, columnDefinition = "NVARCHAR(500)")
    private String guestNote; 

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 30)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ReservationItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "reservation", fetch = FetchType.LAZY)
    private TableSession session;

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
    public Boolean getIsForOther() { return isForOther; }
    public String getGuestName() { return guestName; }
    public String getGuestPhone() { return guestPhone; }
    public String getGuestNote() { return guestNote; }
    public ReservationStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    @JsonIgnore
    public Customer getCustomer() { return customer; }

    @JsonIgnore
    public DiningTable getTable() { return table; }

    @JsonIgnore
    public Area getArea() { return area; }

    @JsonIgnore
    public List<ReservationItem> getItems() { return items; }

    @JsonIgnore
    public TableSession getSession() { return session; }

    public void setId(Integer id) { this.id = id; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public void setTable(DiningTable table) { this.table = table; }
    public void setArea(Area area) { this.area = area; }
    public void setReservedAt(LocalDateTime reservedAt) { this.reservedAt = reservedAt; }
    public void setPartySize(Integer partySize) { this.partySize = partySize; }
    public void setNote(String note) { this.note = note; }
    public void setIsForOther(Boolean isForOther) { this.isForOther = isForOther; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }
    public void setGuestNote(String guestNote) { this.guestNote = guestNote; }
    public void setStatus(ReservationStatus status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setItems(List<ReservationItem> items) { this.items = items; }
    public void setSession(TableSession session) { this.session = session; }
}
