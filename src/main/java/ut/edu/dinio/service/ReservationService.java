package ut.edu.dinio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.ReservationItem;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.enums.ReservationStatus;
import ut.edu.dinio.repositories.MenuItemRepository;
import ut.edu.dinio.repositories.ReservationItemRepository;
import ut.edu.dinio.repositories.ReservationRepository;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private ReservationItemRepository reservationItemRepository;

    @Autowired
    private AuditLogService auditLogService;

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

    public List<Map<String, Object>> getAllReservationsByDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        List<Reservation> reservations = reservationRepository.findAllWithDetailsByDate(start, end);

        return reservations.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    @Transactional
    public void confirmReservation(Integer id, StaffUser staff) {
        Reservation res = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã đặt bàn"));
        res.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(res);
        auditLogService.log(
            staff,
            "CONFIRM_RESERVATION",
            "Reservation",
            id,
            Map.of("status", "CONFIRMED")
        );
    }

    @Transactional
    public void cancelReservation(Integer id, StaffUser staff) {
        Reservation res = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã đặt bàn"));

        res.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(res);

        reservationItemRepository.deleteByReservationId(id);
         auditLogService.log(
            staff,
            "CANCEL_RESERVATION",
            "Reservation",
            id,
            Map.of("status", "CANCELLED", "deletedPreorderItems", true)
        );
    }

    private Map<String, Object> convertToMap(Reservation res) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", res.getId());
        map.put("reservedAt", res.getReservedAt().toString());
        map.put("slot", res.getReservedAt().getHour() < 15 ? "MORNING" : "EVENING");
        map.put("status", res.getStatus().toString());
        map.put("partySize", res.getPartySize());
        map.put("note", res.getNote() != null ? res.getNote() : "");

        Map<String, String> customerMap = new HashMap<>();
        if (res.getCustomer() != null) {
            customerMap.put("fullName", res.getCustomer().getFullName());
            customerMap.put("phone", res.getCustomer().getPhone());
        }
        map.put("customer", customerMap);

        Map<String, String> tableMap = new HashMap<>();
        if (res.getTable() != null) {
            tableMap.put("code", res.getTable().getCode());
        } else {
            tableMap.put("code", "Chưa gán");
        }
        map.put("table", tableMap);

        Map<String, String> areaMap = new HashMap<>();
        if (res.getArea() != null) {
            areaMap.put("name", res.getArea().getName());
        } else {
            areaMap.put("name", "—");
        }
        map.put("area", areaMap);

        return map;
    }

    @Scheduled(fixedRate = 900000)
    @Transactional
    public void autoCancelExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();

        List<Reservation> expiredReservations = reservationRepository
                .findByReservedAtBeforeAndStatus(now, ReservationStatus.PENDING);

        if (!expiredReservations.isEmpty()) {
            for (Reservation res : expiredReservations) {
                res.setStatus(ReservationStatus.CANCELLED);
                res.setNote(res.getNote()  +" (Hệ thống tự động hủy do quá giờ xác nhận)");

                reservationRepository.save(res);

                reservationItemRepository.deleteByReservationId(res.getId());
            }
            System.out.println("Đã tự động hủy " + expiredReservations.size() + " đơn đặt bàn hết hạn");
        }
    }

}