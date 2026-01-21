package ut.edu.dinio.pojo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "Customer_Table")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CustomerID")
    private Integer id;

    @Column(name = "FullName", nullable = false, length = 120, columnDefinition = "NVARCHAR(120)")
    private String fullName;

    @Column(name = "Phone", nullable = false, length = 30, columnDefinition = "NVARCHAR(30)")
    private String phone;

    @Column(name = "Email", length = 120, unique=true, columnDefinition = "NVARCHAR(120)")
    private String email;

    @Column(name = "Gender")
    private Boolean gender;

    @Column(name = "DateOfBirth")
    private LocalDate dateOfBirth;

    @Column(name = "Address", nullable = false, length = 120, columnDefinition = "NVARCHAR(120)")
    private String address;

    @Column(name = "Note", length = 500, columnDefinition = "NVARCHAR(500)")
    private String note;

    @Column(name = "PasswordHash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Reservation> reservations = new ArrayList<>();

    @Column(name = "ImageUrl", length = 500, columnDefinition = "NVARCHAR(500)")
    private String imageUrl;

    public Customer() {}

    public Customer(String fullName, String phone, String email) {
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
    }

    public Customer(String address, LocalDate dateOfBirth, String email, String fullName, Boolean gender,  String imageUrl, String note, String phone) {
        this.address = address;
        this.dateOfBirth = dateOfBirth;
        this.email = email;
        this.fullName = fullName;
        this.gender = gender;
        this.imageUrl = imageUrl;
        this.note = note;
        this.phone = phone;
    }

    public Integer getId() { return id; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public Boolean getGender() { return gender; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getAddress() { return address; }
    public String getNote() { return note; }
    public String getPasswordHash() { return passwordHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getImageUrl() { return imageUrl; }

    @JsonIgnore
    public List<Reservation> getReservations() { return reservations; }

    public void setId(Integer id) { this.id = id; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setReservations(List<Reservation> reservations) { this.reservations = reservations; }
    public void setGender(Boolean gender) { this.gender = gender; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public void setAddress(String address) { this.address = address; }
    public void setNote(String note) { this.note = note; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
    