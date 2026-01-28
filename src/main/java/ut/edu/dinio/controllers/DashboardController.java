package ut.edu.dinio.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import ut.edu.dinio.service.DashboardService;

@RestController
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/api/dashboard/stats")
    public Map<String, Object> getDashboardStats() {
        return dashboardService.getDashboardData();
    }
}