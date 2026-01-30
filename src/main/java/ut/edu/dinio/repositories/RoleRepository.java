package ut.edu.dinio.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ut.edu.dinio.pojo.Role;
import ut.edu.dinio.pojo.enums.RoleName;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByName(RoleName name);
    
    @Override
    Optional<Role> findById(Integer id);

    @Override
    java.util.List<Role> findAll();
}
