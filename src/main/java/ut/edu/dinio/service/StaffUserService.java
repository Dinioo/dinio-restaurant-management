package ut.edu.dinio.service;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.Role;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.enums.UserStatus;
import ut.edu.dinio.repositories.RoleRepository;
import ut.edu.dinio.repositories.StaffUserRepository;

@Service
public class StaffUserService {

    @Autowired
    private StaffUserRepository staffRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogService auditLogService;

    public StaffUser loginStaff(String identifier, String rawPassword) {
        Optional<StaffUser> staffOpt;

        staffOpt = staffRepository.findByUsername(identifier);
        if (staffOpt.isPresent()) {
            StaffUser staff = staffOpt.get();

            if (passwordEncoder.matches(rawPassword, staff.getPasswordHash())
                    && staff.getStatus() == UserStatus.ACTIVE) {
                return staff;
            }
        }
        return null;
    }

    public StaffUser createStaff(String name, String username, String rawPassword, Integer roleId, StaffUser actor) {
        StaffUser s = new StaffUser();
        s.setName(name);
        s.setUsername(username);
        s.setPasswordHash(passwordEncoder.encode(rawPassword));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        s.setRole(role);

        s = staffRepository.save(s);

        auditLogService.log(
                actor,
                "CREATE_STAFF",
                "StaffUser",
                s.getId(),
                Map.of("username", username, "roleId", roleId));

        return s;
    }

    public void deleteStaff(Integer id, StaffUser actor) {
        staffRepository.deleteById(id);
        auditLogService.log(actor, "DELETE_STAFF", "StaffUser", id);
    }

    public void updateUsername(Integer id, String username, StaffUser actor) {
        StaffUser s = staffRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy staff"));
        String old = s.getUsername();
        s.setUsername(username);
        staffRepository.save(s);
        auditLogService.log(actor, "UPDATE_STAFF_USERNAME", "StaffUser", id, Map.of("from", old, "to", username));
    }

    public void updateName(Integer id, String name, StaffUser actor) {
        StaffUser s = staffRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy staff"));
        String old = s.getName();
        s.setName(name);
        staffRepository.save(s);
        auditLogService.log(actor, "UPDATE_STAFF_NAME", "StaffUser", id, Map.of("from", old, "to", name));
    }

    public void updatePassword(Integer id, String rawPassword, StaffUser actor) {
        StaffUser s = staffRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy staff"));
        s.setPasswordHash(passwordEncoder.encode(rawPassword));
        staffRepository.save(s);
        auditLogService.log(actor, "UPDATE_STAFF_PASSWORD", "StaffUser", id);
    }

    public void updateStatus(Integer id, UserStatus status, StaffUser actor) {
        StaffUser s = staffRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy staff"));
        UserStatus old = s.getStatus();
        s.setStatus(status);
        staffRepository.save(s);
        auditLogService.log(actor, "UPDATE_STAFF_STATUS", "StaffUser", id,
                Map.of("from", old.name(), "to", status.name()));
    }
}