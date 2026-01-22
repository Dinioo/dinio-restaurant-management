package ut.edu.dinio.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.Customer;
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
    public ResponseEntity<?> createReservation(@RequestBody Map<String, Object> data, HttpSession session) {
        Customer user = (Customer) session.getAttribute("currentUser");
        
        if (user == null) {
            return ResponseEntity.status(401).body("Vui lòng đăng nhập!");
        }

        String result = tableMapService.createReservation(data, user);
        
        if ("success".equals(result)) {
            return ResponseEntity.ok(Map.of("status", "success", "message", "Đặt bàn thành công!"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", result));
        }
    }

    @GetMapping("/api/reservations/occupied")
    @ResponseBody
    public ResponseEntity<?> getOccupiedReservations(@RequestParam String date) {
        try {
            List<Map<String, Object>> occupied = reservationService.getOccupiedReservationsByDate(date);
            return ResponseEntity.ok(occupied);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi định dạng ngày: " + e.getMessage());
        }
    }
}