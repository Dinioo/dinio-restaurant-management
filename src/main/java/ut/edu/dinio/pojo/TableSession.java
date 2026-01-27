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
import ut.edu.dinio.pojo.enums.SessionStatus;

@Entity
@Table(name = "Table_Session")
public class TableSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SessionID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TableID", nullable = false)
    private DiningTable table;

    @Column(name = "OpenedAt", nullable = false)
    private LocalDateTime openedAt = LocalDateTime.now();

    @Column(name = "ClosedAt")
    private LocalDateTime closedAt;

    @Column(name = "Covers")
    private Integer covers;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AssignedStaffID")
    private StaffUser assignedStaff;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 30)
    private SessionStatus status = SessionStatus.OPEN;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    @OneToOne(mappedBy = "session", fetch = FetchType.LAZY)
    private Invoice invoice;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ReservationID", unique = true)
    private Reservation reservation;

    public TableSession() {}

    public TableSession(DiningTable table, Integer covers, StaffUser assignedStaff) {
        this.table = table;
        this.covers = covers;
        this.assignedStaff = assignedStaff;
        this.openedAt = LocalDateTime.now();
        this.status = SessionStatus.OPEN;
    }

    public Integer getId() { return id; }
    public LocalDateTime getOpenedAt() { return openedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public Integer getCovers() { return covers; }
    public SessionStatus getStatus() { return status; }

    @JsonIgnore
    public DiningTable getTable() { return table; }

    @JsonIgnore
    public StaffUser getAssignedStaff() { return assignedStaff; }

    @JsonIgnore
    public List<Order> getOrders() { return orders; }

    @JsonIgnore
    public Invoice getInvoice() { return invoice; }

    @JsonIgnore
    public Reservation getReservation() { return reservation; }

    public void setId(Integer id) { this.id = id; }
    public void setTable(DiningTable table) { this.table = table; }
    public void setOpenedAt(LocalDateTime openedAt) { this.openedAt = openedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public void setCovers(Integer covers) { this.covers = covers; }
    public void setAssignedStaff(StaffUser assignedStaff) { this.assignedStaff = assignedStaff; }
    public void setStatus(SessionStatus status) { this.status = status; }
    public void setOrders(List<Order> orders) { this.orders = orders; }
    public void setInvoice(Invoice invoice) { this.invoice = invoice; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }
}
