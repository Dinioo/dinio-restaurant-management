package ut.edu.dinio.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.StaffUser;

@Repository
public interface StaffUserRepository extends JpaRepository<StaffUser, Integer> {
    Optional<StaffUser> findByUsername(String username);
    boolean existsByUsername(String username);
    @Query("select s from StaffUser s left join fetch s.role r order by s.id desc")
    List<StaffUser> findAllWithRole();
}
