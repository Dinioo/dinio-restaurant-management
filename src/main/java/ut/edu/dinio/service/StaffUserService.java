package ut.edu.dinio.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.enums.UserStatus;
import ut.edu.dinio.repositories.StaffUserRepository;
import java.util.Optional;

@Service
public class StaffUserService {

    @Autowired
    private StaffUserRepository staffRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public StaffUser loginStaff(String identifier, String rawPassword) {
        Optional<StaffUser> staffOpt;

         staffOpt = staffRepository.findByUsername(identifier);
        if (staffOpt.isPresent()) {
            StaffUser staff = staffOpt.get();

            if (passwordEncoder.matches(rawPassword, staff.getPasswordHash()) && staff.getStatus() == UserStatus.ACTIVE) {
                return staff;
            }
        }
        return null; 
    }
    
}