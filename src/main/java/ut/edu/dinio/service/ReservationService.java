package ut.edu.dinio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.ReservationItem;
import ut.edu.dinio.pojo.enums.ReservationStatus;
import ut.edu.dinio.repositories.MenuItemRepository;
import ut.edu.dinio.repositories.ReservationRepository;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private MenuItemRepository menuItemRepository;

    public List<Reservation> getReservationsByCustomer(Integer customerId) {
        return reservationRepository.findByCustomerIdOrderByReservedAtDesc(customerId);
    }

    public String cancelReservation(Integer reservationId, Customer currentUser) {
        Optional<Reservation> resOpt = reservationRepository.findById(reservationId);

        if (resOpt.isEmpty()) {
            return "Không tìm thấy đơn đặt bàn!";
        }

        Reservation res = resOpt.get();

        if (!res.getCustomer().getId().equals(currentUser.getId())) {
            return "Bạn không có quyền hủy đơn này!";
        }

        if (res.getStatus() == ReservationStatus.CANCELLED) {
            return "Đơn này đã bị hủy trước đó!";
        }

        if (res.getStatus() == ReservationStatus.COMPLETED) {
            return "Đơn hàng đã hoàn thành, không thể hủy!";
        }

        res.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(res);

        return "success";
    }

    public List<Map<String, Object>> getOccupiedReservationsByDate(String date) {
        LocalDate localDate = LocalDate.parse(date);
        LocalDateTime startOfDay = localDate.atStartOfDay();
        LocalDateTime endOfDay = localDate.atTime(23, 59, 59);

        List<Reservation> reservations = reservationRepository.findByReservedAtBetweenAndStatusNot(
                startOfDay, endOfDay, ReservationStatus.CANCELLED);

        return reservations.stream().map(res -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", res.getId());
            map.put("tableId", res.getTable().getId());
            map.put("reservedAt", res.getReservedAt().toString());
            map.put("seats", res.getTable().getSeats());
            return map;
        }).collect(Collectors.toList());
    }

    public Reservation getById(Integer id) {
        return reservationRepository.findById(id).orElse(null);
    }

    public void replaceReservationItems(
            Reservation r,
            List<Map<String, Object>> items) {
        r.getItems().clear();

        for (Map<String, Object> it : items) {
            Integer menuItemId = Integer.valueOf(it.get("menuItemId").toString());
            Integer qty = Integer.valueOf(it.get("qty").toString());
            String note = (String) it.get("note");

            MenuItem mi = menuItemRepository.findById(menuItemId)
                    .orElseThrow(() -> new RuntimeException("MenuItem not found"));

            ReservationItem ri = new ReservationItem();
            ri.setReservation(r);
            ri.setMenuItem(mi);
            ri.setQty(qty);
            ri.setUnitPrice(mi.getBasePrice());
            ri.setNote(note);

            r.getItems().add(ri);
        }

        reservationRepository.save(r);
    }

    
}