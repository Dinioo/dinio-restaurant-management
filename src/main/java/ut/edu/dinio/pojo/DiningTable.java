package ut.edu.dinio.pojo;

import java.util.ArrayList;
import java.util.List;

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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import ut.edu.dinio.pojo.enums.TableStatus;

@Entity
@Table(name = "Dining_Table")
public class DiningTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TableID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AreaID", nullable = false)
    private Area area;

    @Column(name = "Code", nullable = false, length = 20, columnDefinition = "NVARCHAR(20)")
    private String code;

    @Column(name = "Seats", nullable = false)
    private Integer seats;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 30)
    private TableStatus status = TableStatus.AVAILABLE;

    @OneToMany(mappedBy = "table", fetch = FetchType.LAZY)
    private List<TableSession> sessions = new ArrayList<>();

    public DiningTable() {}

    public DiningTable(Area area, String code, Integer seats) {
        this.area = area;
        this.code = code;
        this.seats = seats;
    }

    public Integer getId() { return id; }
    public String getCode() { return code; }
    public Integer getSeats() { return seats; }
    public TableStatus getStatus() { return status; }

    @JsonIgnore
    public Area getArea() { return area; }

    @JsonIgnore
    public List<TableSession> getSessions() { return sessions; }

    public void setId(Integer id) { this.id = id; }
    public void setArea(Area area) { this.area = area; }
    public void setCode(String code) { this.code = code; }
    public void setSeats(Integer seats) { this.seats = seats; }
    public void setStatus(TableStatus status) { this.status = status; }
    public void setSessions(List<TableSession> sessions) { this.sessions = sessions; }
}
