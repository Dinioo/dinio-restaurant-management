package ut.edu.dinio.controllers;

import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.repositories.AuditLogRepository;
import ut.edu.dinio.repositories.StaffUserRepository;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final AuditLogRepository auditLogRepository;
    private final StaffUserRepository staffUserRepository;

    public AdminController(
            AuditLogRepository auditLogRepository,
            StaffUserRepository staffUserRepository) {
        this.auditLogRepository = auditLogRepository;
        this.staffUserRepository = staffUserRepository;
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute(
                "logs",
                auditLogRepository.findTop100ByOrderByTimestampDesc());
        return "admin/dashboard";
    }

    @GetMapping("/staff")
    public String staff(Model model) {
        model.addAttribute("staffs", staffUserRepository.findAllWithRole());
        return "admin/staff";
    }

    @PostMapping("/staff/create")
    public String createStaff(StaffUser staff) {
        staffUserRepository.save(staff);
        return "redirect:/dinio/admin/staff";
    }

    @PostMapping("/staff/delete")
    public String deleteStaff(@RequestParam Integer id) {
        staffUserRepository.deleteById(id);
        return "redirect:/dinio/admin/staff";
    }

    @PostMapping("/staff/update-username")
    @ResponseBody
    public Map<String, Object> updateUsername(@RequestBody Map<String, Object> body) {
        Integer id = body.get("id") == null ? null : Integer.valueOf(body.get("id").toString());
        String username = body.get("username") == null ? "" : body.get("username").toString().trim();

        if (id == null)
            return Map.of("status", "error", "message", "Thiếu id");
        if (username.isEmpty())
            return Map.of("status", "error", "message", "Username trống");

        StaffUser s = staffUserRepository.findById(id).orElse(null);
        if (s == null)
            return Map.of("status", "error", "message", "Không tìm thấy staff");

        s.setUsername(username);
        staffUserRepository.save(s);

        return Map.of("status", "success");
    }
}
