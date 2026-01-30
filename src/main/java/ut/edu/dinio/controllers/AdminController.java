package ut.edu.dinio.controllers;

import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import ut.edu.dinio.pojo.Role;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.enums.UserStatus;
import ut.edu.dinio.repositories.AuditLogRepository;
import ut.edu.dinio.repositories.RoleRepository;
import ut.edu.dinio.repositories.StaffUserRepository;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final AuditLogRepository auditLogRepository;
    private final StaffUserRepository staffUserRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(
            AuditLogRepository auditLogRepository,
            StaffUserRepository staffUserRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.auditLogRepository = auditLogRepository;
        this.staffUserRepository = staffUserRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
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
        model.addAttribute("roles", roleRepository.findAll());
        return "admin/staff";
    }

    @PostMapping("/staff/create")
    public String createStaff(
            @RequestParam String name,
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam Integer roleId) {
        StaffUser s = new StaffUser();
        s.setName(name);
        s.setUsername(username);
        s.setPasswordHash(passwordEncoder.encode(password));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        s.setRole(role);

        staffUserRepository.save(s);
        return "redirect:/admin/staff";
    }

    @PostMapping("/staff/delete")
    public String deleteStaff(@RequestParam Integer id) {
        staffUserRepository.deleteById(id);
        return "redirect:/admin/staff";
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

    @PostMapping("/staff/update-password")
    @ResponseBody
    public Map<String, Object> updatePassword(@RequestBody Map<String, Object> body) {
        Integer id = body.get("id") == null ? null : Integer.valueOf(body.get("id").toString());
        String password = body.get("password") == null ? "" : body.get("password").toString();

        if (id == null || password.isBlank()) {
            return Map.of("status", "error", "message", "Thiếu dữ liệu");
        }

        StaffUser s = staffUserRepository.findById(id).orElse(null);
        if (s == null) {
            return Map.of("status", "error", "message", "Không tìm thấy staff");
        }

        s.setPasswordHash(passwordEncoder.encode(password));
        staffUserRepository.save(s);

        return Map.of("status", "success");
    }

    @PostMapping("/staff/update-name")
    @ResponseBody
    public Map<String, Object> updateName(@RequestBody Map<String, Object> body) {
        Integer id = body.get("id") == null ? null : Integer.valueOf(body.get("id").toString());
        String name = body.get("name") == null ? "" : body.get("name").toString().trim();

        if (id == null)
            return Map.of("status", "error", "message", "Thiếu id");
        if (name.isEmpty())
            return Map.of("status", "error", "message", "Name trống");

        StaffUser s = staffUserRepository.findById(id).orElse(null);
        if (s == null)
            return Map.of("status", "error", "message", "Không tìm thấy staff");

        s.setName(name);
        staffUserRepository.save(s);
        return Map.of("status", "success");
    }

    @PostMapping("/staff/update-status")
    @ResponseBody
    public Map<String, Object> updateStatus(@RequestBody Map<String, Object> body) {
        Integer id = body.get("id") == null ? null : Integer.valueOf(body.get("id").toString());
        String st = body.get("status") == null ? "" : body.get("status").toString().trim();

        if (id == null)
            return Map.of("status", "error", "message", "Thiếu id");
        if (st.isEmpty())
            return Map.of("status", "error", "message", "Status trống");

        StaffUser s = staffUserRepository.findById(id).orElse(null);
        if (s == null)
            return Map.of("status", "error", "message", "Không tìm thấy staff");

        try {
            UserStatus status = UserStatus.valueOf(st);
            s.setStatus(status);
            staffUserRepository.save(s);
            return Map.of("status", "success");
        } catch (Exception e) {
            return Map.of("status", "error", "message", "Status không hợp lệ");
        }
    }
}
