package ut.edu.dinio.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Customer;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    @Query("SELECT c FROM Customer c WHERE c.email = :id OR c.phone = :id")
    Optional<Customer> findByIdentifier(@Param("id") String identifier);
}