package ut.edu.dinio.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.ReservationItem;

@Repository
public interface ReservationItemRepository extends JpaRepository<ReservationItem, Integer> {

    @Modifying
    @Query("DELETE FROM ReservationItem ri WHERE ri.reservation.id = :resId")
    void deleteByReservationId(@Param("resId") Integer resId);
}