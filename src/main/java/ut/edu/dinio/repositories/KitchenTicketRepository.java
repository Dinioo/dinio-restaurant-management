package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ut.edu.dinio.pojo.KitchenTicket;
import ut.edu.dinio.pojo.enums.TicketStatus;

public interface KitchenTicketRepository extends JpaRepository<KitchenTicket, Integer> {

    List<KitchenTicket> findByStatus(TicketStatus status);
    List<KitchenTicket> findByOrderId(Integer orderId);

    List<KitchenTicket> findByStatusOrderByCreatedAtAsc(TicketStatus status);
}
