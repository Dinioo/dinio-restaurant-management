package ut.edu.dinio.pojo;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Restaurant_Info")
public class RestaurantInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RestaurantInfoID")
    private Integer id;

    @Column(name = "Name", nullable = false, length = 150, columnDefinition = "NVARCHAR(150)")
    private String name;

    @Column(name = "Address", nullable = false, length = 255, columnDefinition = "NVARCHAR(255)")
    private String address;

    @Column(name = "Phone", length = 30, columnDefinition = "NVARCHAR(30)")
    private String phone;

    @Column(name = "OpenHours", length = 100, columnDefinition = "NVARCHAR(100)")
    private String openHours;

    @Column(name = "Description", length = 2000, columnDefinition = "NVARCHAR(2000)")
    private String description;

    public RestaurantInfo() {}

    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getOpenHours() { return openHours; }
    public String getDescription() { return description; }

    public void setId(Integer id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setAddress(String address) { this.address = address; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setOpenHours(String openHours) { this.openHours = openHours; }
    public void setDescription(String description) { this.description = description; }
}
