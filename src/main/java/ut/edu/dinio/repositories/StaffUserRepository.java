package ut.edu.dinio.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ut.edu.dinio.pojo.StaffUser;

@Repository
public interface StaffUserRepository extends JpaRepository<StaffUser, Integer> {
    Optional<StaffUser> findByUsername(String username);
}
