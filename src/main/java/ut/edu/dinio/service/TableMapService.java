package ut.edu.dinio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ut.edu.dinio.pojo.Area;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.TableSession;
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

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private InvoiceService invoiceService;

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

   public Reservation createReservation(Map<String, Object> data, Customer customer) {

    Integer tableId = Integer.valueOf(data.get("tableId").toString());
    Integer guests = Integer.valueOf(data.get("guests").toString());
    String date = data.get("date").toString();
    String time = data.get("time").toString();
    String note = (String) data.get("note");
    String mode = (String) data.get("mode");

    DiningTable table = tableRepository.findById(tableId)
        .orElseThrow(() -> new RuntimeException("Table not found"));

    Reservation r = new Reservation();
    r.setCustomer(customer);
    r.setTable(table);
    r.setArea(table.getArea());
    r.setPartySize(guests);
    r.setNote(note);

    LocalDate d = LocalDate.parse(date);
    LocalTime t = LocalTime.parse(time);
    r.setReservedAt(LocalDateTime.of(d, t));

    boolean isForOther = "other".equals(mode);
    r.setIsForOther(isForOther);

    if (isForOther) {
        r.setGuestName((String) data.get("guestName"));
        r.setGuestPhone((String) data.get("guestPhone"));
        r.setGuestNote((String) data.get("guestNote"));
    }

    return reservationRepository.save(r);
}
    @Transactional
    public void updateTableStatus(Integer tableId, TableStatus newStatus, StaffUser staff) {
        DiningTable table = tableRepository.findById(tableId).orElse(null);
        if (table == null) return;

        TableStatus oldStatus = table.getStatus();

        Integer openedSessionId = null;
        Integer activeSessionId = null;

        TableSession active = sessionRepository
                .findTopByTableIdAndStatusInOrderByOpenedAtDesc(
                        tableId,
                        List.of(SessionStatus.OPEN, SessionStatus.CHECK_REQUESTED))
                .orElse(null);
        if (active != null) activeSessionId = active.getId();

        if (newStatus == TableStatus.IN_SERVICE) {
            if (sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.OPEN).isEmpty()) {
                TableSession session = new TableSession(table, table.getSeats(), staff);
                session = sessionRepository.save(session);
                openedSessionId = session.getId();
            }
        }

        if (newStatus == TableStatus.NEED_PAYMENT) {
            if (active == null || active.getStatus() != SessionStatus.OPEN) {
                throw new RuntimeException("Bàn chưa có session đang mở");
            }

            invoiceService.generateInvoiceForCloseSession(tableId, staff);

            active.setStatus(SessionStatus.CHECK_REQUESTED);
            sessionRepository.save(active);
        }


        table.setStatus(newStatus);
        tableRepository.save(table);

        Map<String, Object> details = new HashMap<>();
        details.put("from", oldStatus != null ? oldStatus.name() : null);
        details.put("to", newStatus != null ? newStatus.name() : null);
        details.put("openedSessionId", openedSessionId);
        details.put("activeSessionId", activeSessionId);

        auditLogService.log(
                staff,
                "TABLE_STATUS_CHANGE",
                "DiningTable",
                tableId,
                details);

        if (openedSessionId != null) {
            auditLogService.log(
                    staff,
                    "OPEN_SESSION",
                    "TableSession",
                    openedSessionId,
                    Map.of(
                            "tableId", tableId,
                            "covers", table.getSeats()));
        }        
    }

    @Transactional
    public void closeSession(Integer tableId, StaffUser staff) {
        Integer closedSessionId = null;

        sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.OPEN).ifPresent(s -> {
            s.setStatus(SessionStatus.CLOSED);
            s.setClosedAt(LocalDateTime.now());
            sessionRepository.save(s);
        });

        closedSessionId = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.CLOSED)
            .stream()
            .findFirst()
            .map(TableSession::getId)
            .orElse(null);

        tableRepository.findById(tableId).ifPresent(t -> {
            t.setStatus(TableStatus.CLEANING);
            tableRepository.save(t);
        });

        auditLogService.log(
        staff,
        "CLOSE_SESSION",
        "DiningTable",
        tableId,
        Map.of("closedSessionId", closedSessionId)
    );
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