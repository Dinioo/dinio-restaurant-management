package ut.edu.dinio.pojo;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(name = "Menu_Item")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MenuItemID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryID", nullable = false)
    private MenuCategory category;

    @Column(name = "Name", nullable = false, length = 150, columnDefinition = "NVARCHAR(150)")
    private String name;

    @Column(name = "BasePrice", nullable = false, precision = 18, scale = 2)
    private BigDecimal basePrice = BigDecimal.ZERO;

    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;

    @Column(name = "IsAvailable", nullable = false)
    private Boolean isAvailable = true;

    @Column(name = "ImageUrl", length = 500, columnDefinition = "NVARCHAR(500)")
    private String imageUrl;

    public MenuItem() {}

    public MenuItem(MenuCategory category, String name, BigDecimal basePrice) {
        this.category = category;
        this.name = name;
        this.basePrice = basePrice;
    }

    public Integer getId() { return id; }
    public String getName() { return name; }
    public BigDecimal getBasePrice() { return basePrice; }
    public Boolean getIsActive() { return isActive; }
    public Boolean getIsAvailable() { return isAvailable; }
    public String getImageUrl() { return imageUrl; }

    @JsonIgnore
    public MenuCategory getCategory() { return category; }

    public void setId(Integer id) { this.id = id; }
    public void setCategory(MenuCategory category) { this.category = category; }
    public void setName(String name) { this.name = name; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
