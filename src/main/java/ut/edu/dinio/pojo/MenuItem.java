package ut.edu.dinio.pojo;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import ut.edu.dinio.pojo.enums.ItemTag;
import jakarta.persistence.Lob;
import ut.edu.dinio.pojo.enums.SpiceLevel;

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

    @Column(name = "Description", nullable = false, length = 150, columnDefinition = "NVARCHAR(150)")
    private String description;

    @ElementCollection(targetClass = ItemTag.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "menu_item_tags",joinColumns = @JoinColumn(name = "MenuItemID"))
    @Column(name = "item_tag", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<ItemTag> itemTags = new HashSet<>();
    @Lob
    @Column(name = "Ingredients", columnDefinition = "NVARCHAR(MAX)")
    private String ingredients; 

    @Column(name = "Calories")
    private Integer calories; 

    @Enumerated(EnumType.STRING)
    @Column(name = "SpiceLevel", length = 20, nullable = false)
    private SpiceLevel spiceLevel = SpiceLevel.NOT_SPICY;

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
    public String getDescription() { return description; }
    public Set<ItemTag> getItemTags() { return itemTags; }
    public String getIngredients() { return ingredients; }
    public Integer getCalories() { return calories; }
    public SpiceLevel getSpiceLevel() { return spiceLevel; }
    public BigDecimal getBasePrice() { return basePrice; }
    public Boolean getIsActive() { return isActive; }
    public Boolean getIsAvailable() { return isAvailable; }
    public String getImageUrl() { return imageUrl; }
    

    @JsonIgnore
    public MenuCategory getCategory() { return category; }

    public void setId(Integer id) { this.id = id; }
    public void setCategory(MenuCategory category) { this.category = category; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setItemTags(Set<ItemTag> itemTags) { this.itemTags = itemTags; }
    public void setIngredients(String ingredients) { this.ingredients = ingredients; }
    public void setCalories(Integer calories) { this.calories = calories; }
    public void setSpiceLevel(SpiceLevel spiceLevel) { this.spiceLevel = spiceLevel; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
