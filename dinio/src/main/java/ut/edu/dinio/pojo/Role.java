package ut.edu.dinio.pojo;

import java.util.HashSet;
import java.util.Set;

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
import jakarta.persistence.Table;
import ut.edu.dinio.pojo.enums.PermissionCode;
import ut.edu.dinio.pojo.enums.RoleName;

@Entity
@Table(name = "Role_Table")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RoleID")
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "RoleName", nullable = false, unique = true, length = 50)
    private RoleName name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "Role_Permission", joinColumns = @JoinColumn(name = "RoleID"))
    @Enumerated(EnumType.STRING)
    @Column(name = "PermissionCode", nullable = false, length = 50)
    private Set<PermissionCode> permissions = new HashSet<>();

    public Role() {}

    public Role(RoleName name) {
        this.name = name;
    }

    public Integer getId() { return id; }
    public RoleName getName() { return name; }
    public Set<PermissionCode> getPermissions() { return permissions; }

    public void setId(Integer id) { this.id = id; }
    public void setName(RoleName name) { this.name = name; }
    public void setPermissions(Set<PermissionCode> permissions) { this.permissions = permissions; }
}
