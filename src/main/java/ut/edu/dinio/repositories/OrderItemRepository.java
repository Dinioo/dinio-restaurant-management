package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ut.edu.dinio.pojo.OrderItem;
import ut.edu.dinio.pojo.enums.OrderItemStatus;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
  List<OrderItem> findByOrderIdOrderByIdAsc(Integer orderId);
  List<OrderItem> findByOrderId(Integer orderId);

  @Query("SELECT oi FROM OrderItem oi " +
            "JOIN FETCH oi.order o " +
            "JOIN FETCH o.session s " +
            "JOIN FETCH s.table t " +
            "JOIN FETCH oi.menuItem mi " +
            "JOIN FETCH mi.category c " +
            "WHERE oi.status IN :statuses " +
            "ORDER BY o.createdAt ASC")
    List<OrderItem> findKitchenItems(@Param("statuses") List<OrderItemStatus> statuses);
}
