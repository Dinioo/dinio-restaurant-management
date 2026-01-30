package ut.edu.dinio.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    @Query("SELECT p FROM Payment p " +
       "JOIN FETCH p.invoice i " +
       "JOIN FETCH i.session s " +
       "LEFT JOIN FETCH s.reservation r " +
       "LEFT JOIN FETCH r.customer c " +
       "WHERE p.paidAt >= :start AND p.paidAt <= :end")
List<Payment> findAllByDateWithDetails(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}