package ut.edu.dinio.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.enums.ReservationStatus;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    List<Reservation> findByCustomerIdOrderByReservedAtDesc(Integer customerId);
    List<Reservation> findByReservedAtBetweenAndStatusNot(LocalDateTime start, LocalDateTime end, ReservationStatus status);
}