package ut.edu.dinio.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.service.ReservationService;
import ut.edu.dinio.service.TableMapService;

@Controller
public class ReservationController {

    @Autowired
    private TableMapService tableMapService;

    @Autowired
    private ReservationService reservationService;

    @GetMapping("/api/areas")
    @ResponseBody
    public ResponseEntity<?> getAreas() {
        try {
            List<Map<String, Object>> areas = tableMapService.getAllAreas();
            return ResponseEntity.ok(areas);
        } catch (Exception e) {
            System.out.println("Error fetching areas: " + e.getMessage());
            return ResponseEntity.status(500).body("Error loading areas");
        }
    }

    @GetMapping("/api/tables")
    @ResponseBody
    public ResponseEntity<?> getTables() {
        try {
            List<Map<String, Object>> tables = tableMapService.getAllTables();
            return ResponseEntity.ok(tables);
        } catch (Exception e) {
            System.out.println("Error fetching tables: " + e.getMessage());
            return ResponseEntity.status(500).body("Error loading tables");
        }
    }

    @PostMapping("/api/reservations/create")
    @ResponseBody
    public ResponseEntity<?> createReservation(
            @RequestBody Map<String, Object> data,
            HttpSession session) {
        Customer user = (Customer) session.getAttribute("currentUser");
        if (user == null)
            return ResponseEntity.status(401).build();

        Reservation saved = tableMapService.createReservation(data, user);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "reservationId", saved.getId()));
    }

    @GetMapping("/api/reservations/occupied")
    public ResponseEntity<?> getOccupiedReservations(@RequestParam("date") String date) {
        try {
            List<Map<String, Object>> occupied = reservationService.getOccupiedReservationsByDate(date);
            return ResponseEntity.ok(occupied);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi lấy dữ liệu đặt bàn: " + e.getMessage());
        }
    }

    @GetMapping("/api/reservations/{id}/summary")
    @ResponseBody
    public ResponseEntity<?> reservationSummary(@PathVariable Integer id) {

        Reservation r = reservationService.getById(id);
        if (r == null)
            return ResponseEntity.notFound().build();

        Map<String, Object> res = new HashMap<>();
        res.put("id", r.getId());
        res.put("reservedAt", r.getReservedAt());
        res.put("partySize", r.getPartySize());

        if (r.getTable() != null) {
            res.put("tableCode", r.getTable().getCode());
            res.put("tableSeats", r.getTable().getSeats());
        }

        if (r.getArea() != null) {
            res.put("areaName", r.getArea().getName());
        }

        return ResponseEntity.ok(res);
    }

    @PostMapping("/api/reservations/{id}/preorder")
    @ResponseBody
    public ResponseEntity<?> savePreorder(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {
        Reservation r = reservationService.getById(id);
        if (r == null)
            return ResponseEntity.notFound().build();

        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");

        reservationService.replaceReservationItems(r, items);

        return ResponseEntity.ok(Map.of("status", "success"));
    }

}