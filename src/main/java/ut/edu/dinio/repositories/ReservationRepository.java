package ut.edu.dinio.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.enums.ReservationStatus;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    List<Reservation> findByCustomerIdOrderByReservedAtDesc(Integer customerId);

    List<Reservation> findByReservedAtBetweenAndStatusNot(LocalDateTime start, LocalDateTime end,
            ReservationStatus status);

    @Query("SELECT r FROM Reservation r WHERE r.table.id = :tableId AND r.status != 'CANCELLED'")
    Optional<Reservation> findActiveReservationByTable(@Param("tableId") Integer tableId);

    long countByStatusAndCreatedAtAfter(ReservationStatus status, LocalDateTime startOfDay);

    List<Reservation> findByReservedAtBetweenAndStatusOrderByReservedAtAsc(
            LocalDateTime start, LocalDateTime end, ReservationStatus status);

    @Query("SELECT r FROM Reservation r " +
       "LEFT JOIN FETCH r.customer " +
       "LEFT JOIN FETCH r.table " +
       "LEFT JOIN FETCH r.area " +
       "WHERE r.reservedAt >= :start AND r.reservedAt <= :end " +
       "ORDER BY r.reservedAt ASC")
    List<Reservation> findAllWithDetailsByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Reservation> findByReservedAtBeforeAndStatus(LocalDateTime dateTime, ReservationStatus status);

    @Query("SELECT r FROM Reservation r " +
       "LEFT JOIN FETCH r.customer " +  
       "WHERE r.reservedAt >= :todayStart " +
       "AND r.reservedAt < :tomorrowStart " +
       "AND r.status = 'CONFIRMED' " + 
       "ORDER BY r.reservedAt ASC")
        List<Reservation> findOccupiedReservationsForMap(
        @Param("todayStart") LocalDateTime todayStart,
        @Param("tomorrowStart") LocalDateTime tomorrowStart
        );

}