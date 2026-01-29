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
@Table(name = "Reservation_Item")
public class ReservationItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "ReservationItemID")
  private Integer id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ReservationID", nullable = false)
  private Reservation reservation;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "MenuItemID", nullable = false)
  private MenuItem menuItem;

  @Column(name = "Qty", nullable = false)
  private Integer qty;

  @Column(name = "UnitPrice", nullable = false, precision = 18, scale = 2)
  private BigDecimal unitPrice = BigDecimal.ZERO;

  @Column(name = "Note", length = 500, columnDefinition = "NVARCHAR(500)")
  private String note;

  public ReservationItem() {}

  public ReservationItem(Reservation reservation, MenuItem menuItem, Integer qty, BigDecimal unitPrice, String note) {
    this.reservation = reservation;
    this.menuItem = menuItem;
    this.qty = qty;
    this.unitPrice = unitPrice;
    this.note = note;
  }

  public Integer getId() { return id; }
  public Integer getQty() { return qty; }
  public BigDecimal getUnitPrice() { return unitPrice; }
  public String getNote() { return note; }

  @JsonIgnore
  public Reservation getReservation() { return reservation; }

  @JsonIgnore
  public MenuItem getMenuItem() { return menuItem; }

  public void setId(Integer id) { this.id = id; }
  public void setReservation(Reservation reservation) { this.reservation = reservation; }
  public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }
  public void setQty(Integer qty) { this.qty = qty; }
  public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
  public void setNote(String note) { this.note = note; }
}
