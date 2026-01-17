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

import ut.edu.dinio.pojo.Area;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.enums.ReservationStatus;
import ut.edu.dinio.pojo.enums.TableStatus;
import ut.edu.dinio.repositories.AreaRepository;
import ut.edu.dinio.repositories.DiningTableRepository;
import ut.edu.dinio.repositories.ReservationRepository;

@Service
public class TableMapService {

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private DiningTableRepository tableRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    /**
     * Lấy tất cả areas
     */
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

    /**
     * Lấy tất cả tables với status
     */
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
            
            // Map area name to key for frontend
            String areaKey = mapAreaToKey(table.getArea() != null ? table.getArea().getName() : "");
            item.put("areaKey", areaKey);

            response.add(item);
        }

        return response;
    }

    /**
     * Map area name to frontend key
     */
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
        return "floor1"; // default
    }

    /**
     * Tạo reservation mới
     */
    public String createReservation(Map<String, Object> data, Customer customer) {
        try {
            // Validate customer
            if (customer == null) {
                return "Vui lòng đăng nhập để đặt bàn!";
            }

            // Parse data
            Integer tableId = (Integer) data.get("tableId");
            String dateStr = (String) data.get("date");
            String timeStr = (String) data.get("time");
            Integer partySize = (Integer) data.get("guests");
            String note = (String) data.get("note");
            String mode = (String) data.get("mode"); // "self" or "other"
            String guestName = (String) data.get("guestName");
            String guestPhone = (String) data.get("guestPhone");

            // Validate required fields
            if (tableId == null || dateStr == null || timeStr == null || partySize == null) {
                return "Thiếu thông tin bắt buộc!";
            }

            // Find table
            Optional<DiningTable> tableOpt = tableRepository.findById(tableId);
            if (tableOpt.isEmpty()) {
                return "Không tìm thấy bàn!";
            }

            DiningTable table = tableOpt.get();

            // Check table capacity
            if (table.getSeats() < partySize) {
                return "Số khách vượt quá sức chứa của bàn!";
            }

            // Parse datetime
            LocalDateTime reservedAt;
            try {
                String datetimeStr = dateStr + "T" + timeStr + ":00";
                reservedAt = LocalDateTime.parse(datetimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                return "Định dạng ngày giờ không hợp lệ!";
            }

            // Check if reservation time is in the past
            if (reservedAt.isBefore(LocalDateTime.now())) {
                return "Không thể đặt bàn trong quá khứ!";
            }

            // Create reservation
            Reservation reservation = new Reservation();
            reservation.setCustomer(customer);
            reservation.setTable(table);
            reservation.setArea(table.getArea());
            reservation.setReservedAt(reservedAt);
            reservation.setPartySize(partySize);
            reservation.setNote(note);
            reservation.setStatus(ReservationStatus.PENDING);

            // Handle "other" mode
            if ("other".equals(mode)) {
                if (guestName == null || guestName.trim().isEmpty()) {
                    return "Vui lòng nhập tên khách!";
                }
                if (guestPhone == null || guestPhone.trim().isEmpty()) {
                    return "Vui lòng nhập số điện thoại khách!";
                }
                
                // Validate phone number: must be exactly 10 digits
                String phoneDigits = guestPhone.trim().replaceAll("\\D", "");
                if (phoneDigits.length() != 10) {
                    return "Số điện thoại phải có đúng 10 chữ số!";
                }
                
                reservation.setIsForOther(true);
                reservation.setGuestName(guestName.trim());
                reservation.setGuestPhone(phoneDigits);
            } else {
                // Mode "self": Lưu thông tin customer (an toàn hơn để NULL)
                reservation.setIsForOther(false);
                reservation.setGuestName(customer.getFullName());
                reservation.setGuestPhone(customer.getPhone());
            }

            // Save reservation
            reservationRepository.save(reservation);

            // Update table status to IN_SERVICE (not RESERVED)
            table.setStatus(TableStatus.IN_SERVICE);
            tableRepository.save(table);

            return "success";

        } catch (Exception e) {
            System.out.println("Error creating reservation: " + e.getMessage());
            e.printStackTrace();
            return "Có lỗi xảy ra khi đặt bàn!";
        }
    }
}