package ut.edu.dinio.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ut.edu.dinio.pojo.Area;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.ReservationStatus;
import ut.edu.dinio.pojo.enums.SessionStatus;
import ut.edu.dinio.pojo.enums.TableStatus;
import ut.edu.dinio.repositories.AreaRepository;
import ut.edu.dinio.repositories.DiningTableRepository;
import ut.edu.dinio.repositories.ReservationRepository;
import ut.edu.dinio.repositories.TableSessionRepository;

@Service
public class TableMapService {

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private DiningTableRepository tableRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TableSessionRepository sessionRepository;

    public List<Map<String, Object>> getAllAreas() {
        List<Area> areas = areaRepository.findAllByOrderByIdAsc();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Area area : areas) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", area.getId());
            item.put("name", area.getName());
            response.add(item);
        }

        return response;
    }

    public List<Map<String, Object>> getAllTables() {
        List<DiningTable> tables = tableRepository.findAllByOrderByAreaIdAscCodeAsc();
        List<Map<String, Object>> response = new ArrayList<>();

        for (DiningTable table : tables) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", table.getId());
            item.put("code", table.getCode());
            item.put("seats", table.getSeats());
            item.put("status", table.getStatus().name());
            item.put("areaId", table.getArea() != null ? table.getArea().getId() : null);
            item.put("areaName", table.getArea() != null ? table.getArea().getName() : "");
            String areaKey = mapAreaToKey(table.getArea() != null ? table.getArea().getName() : "");
            item.put("areaKey", areaKey);

            response.add(item);
        }

        return response;
    }

    private String mapAreaToKey(String areaName) {
        if (areaName.contains("1") || areaName.toLowerCase().contains("floor 1"))
            return "floor1";
        if (areaName.contains("2") || areaName.toLowerCase().contains("floor 2"))
            return "floor2";
        if (areaName.contains("3") || areaName.toLowerCase().contains("floor 3"))
            return "floor3";
        if (areaName.equalsIgnoreCase("VIP"))
            return "vip";
        if (areaName.equalsIgnoreCase("Outdoor"))
            return "outdoor";
        return "floor1";
    }

    public String createReservation(Map<String, Object> data, Customer customer) {
        try {
            if (customer == null) {
                return "Vui lòng đăng nhập để đặt bàn!";
            }

            Integer tableId = (Integer) data.get("tableId");
            String dateStr = (String) data.get("date");
            String timeStr = (String) data.get("time");
            Integer partySize = (Integer) data.get("guests");
            String note = (String) data.get("note");
            String mode = (String) data.get("mode");
            String guestName = (String) data.get("guestName");
            String guestPhone = (String) data.get("guestPhone");

            if (tableId == null || dateStr == null || timeStr == null || partySize == null) {
                return "Thiếu thông tin bắt buộc!";
            }

            Optional<DiningTable> tableOpt = tableRepository.findById(tableId);
            if (tableOpt.isEmpty()) {
                return "Không tìm thấy bàn!";
            }

            DiningTable table = tableOpt.get();

            if (table.getSeats() < partySize) {
                return "Số khách vượt quá sức chứa của bàn!";
            }

            LocalDateTime reservedAt;
            try {
                String datetimeStr = dateStr + "T" + timeStr + ":00";
                reservedAt = LocalDateTime.parse(datetimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                return "Định dạng ngày giờ không hợp lệ!";
            }

            if (reservedAt.isBefore(LocalDateTime.now())) {
                return "Không thể đặt bàn trong quá khứ!";
            }

            Reservation reservation = new Reservation();
            reservation.setCustomer(customer);
            reservation.setTable(table);
            reservation.setArea(table.getArea());
            reservation.setReservedAt(reservedAt);
            reservation.setPartySize(partySize);
            reservation.setNote(note);
            reservation.setStatus(ReservationStatus.PENDING);

            if ("other".equals(mode)) {
                if (guestName == null || guestName.trim().isEmpty()) {
                    return "Vui lòng nhập tên khách!";
                }
                if (guestPhone == null || guestPhone.trim().isEmpty()) {
                    return "Vui lòng nhập số điện thoại khách!";
                }

                String phoneDigits = guestPhone.trim().replaceAll("\\D", "");
                if (phoneDigits.length() != 10) {
                    return "Số điện thoại phải có đúng 10 chữ số!";
                }

                reservation.setIsForOther(true);
                reservation.setGuestName(guestName.trim());
                reservation.setGuestPhone(phoneDigits);
            } else {
                reservation.setIsForOther(false);
                reservation.setGuestName(customer.getFullName());
                reservation.setGuestPhone(customer.getPhone());
            }

            reservationRepository.save(reservation);
            tableRepository.save(table);

            return "success";

        } catch (Exception e) {
            System.out.println("Error creating reservation: " + e.getMessage());
            e.printStackTrace();
            return "Có lỗi xảy ra khi đặt bàn!";
        }
    }

    @Transactional
    public void updateTableStatus(Integer tableId, TableStatus newStatus, StaffUser staff) {
        DiningTable table = tableRepository.findById(tableId).orElse(null);
        if (table == null)
            return;
        table.setStatus(newStatus);
        if (newStatus == TableStatus.IN_SERVICE) {
            if (sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.OPEN).isEmpty()) {
                TableSession session = new TableSession(table, table.getSeats(), staff);
                sessionRepository.save(session);
            }
        }
        if (newStatus == TableStatus.CLEANING) {
            sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.OPEN).ifPresent(s -> {
                s.setStatus(SessionStatus.CLOSED);
                s.setClosedAt(LocalDateTime.now());
                sessionRepository.save(s);
            });
        }
        tableRepository.save(table);
    }

    @Transactional
    public void closeSession(Integer tableId) {
        sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.OPEN).ifPresent(s -> {
            s.setStatus(SessionStatus.CLOSED);
            s.setClosedAt(LocalDateTime.now());
        });
        tableRepository.findById(tableId).ifPresent(t -> t.setStatus(TableStatus.CLEANING));
    }

    public DiningTable getTableById(Integer id) {
        return tableRepository.findById(id).orElse(null);
    }

    public String getGuestNameByReservationId(Integer reservationId) {
        Reservation res = reservationRepository.findById(reservationId).orElse(null);
        if (res == null)
            return null;

        if (res.getIsForOther() != null && res.getIsForOther()) {
            return res.getGuestName();
        }

        return res.getCustomer() != null ? res.getCustomer().getFullName() : "Khách đặt";
    }

}