package ut.edu.dinio.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Invoice;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    @Query("SELECT i FROM Invoice i JOIN i.session s WHERE s.openedAt >= :startOfDay")
    List<Invoice> findAllInvoicesOfToday(@Param("startOfDay") LocalDateTime startOfDay);
}