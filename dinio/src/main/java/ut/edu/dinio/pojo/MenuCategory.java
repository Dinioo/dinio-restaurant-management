package ut.edu.dinio.pojo;

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
@Table(name = "Menu_Category")
public class MenuCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CategoryID")
    private Integer id;

    @Column(name = "Name", nullable = false, length = 120, columnDefinition = "NVARCHAR(120)")
    private String name;

    @Column(name = "SortOrder")
    private Integer sortOrder;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MenuItem> items = new ArrayList<>();

    public MenuCategory() {}

    public MenuCategory(String name, Integer sortOrder) {
        this.name = name;
        this.sortOrder = sortOrder;
    }

    public Integer getId() { return id; }
    public String getName() { return name; }
    public Integer getSortOrder() { return sortOrder; }

    @JsonIgnore
    public List<MenuItem> getItems() { return items; }

    public void setId(Integer id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public void setItems(List<MenuItem> items) { this.items = items; }
}
