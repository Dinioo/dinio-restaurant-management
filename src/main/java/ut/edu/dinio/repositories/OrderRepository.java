package ut.edu.dinio.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; 
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ut.edu.dinio.pojo.Order;
import ut.edu.dinio.pojo.enums.OrderStatus;
import ut.edu.dinio.pojo.enums.SessionStatus;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    
    @Query("SELECT COUNT(DISTINCT o.session) FROM Order o " + "WHERE o.status = :orderStatus " + "AND o.session.status = :sessionStatus")
    long countTablesWithSentOrders( @Param("orderStatus") OrderStatus orderStatus,  @Param("sessionStatus") SessionStatus sessionStatus);
}