package ut.edu.dinio.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ut.edu.dinio.pojo.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
  List<OrderItem> findByOrderIdOrderByIdAsc(Integer orderId);
  List<OrderItem> findByOrderId(Integer orderId);
}
