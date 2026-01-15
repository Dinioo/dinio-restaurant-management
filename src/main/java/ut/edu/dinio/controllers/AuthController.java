package ut.edu.dinio.controllers;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.enums.RoleName;
import ut.edu.dinio.service.CustomerService;
import ut.edu.dinio.service.StaffUserService;

@Controller
public class AuthController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private StaffUserService staffService;

    @GetMapping("/who-am-i")
    @ResponseBody
    public String whoAmI(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return "Server nói: Bạn là KHÁCH (Chưa đăng nhập)";
        } else {
            return "Server nói: Bạn là USER - Tên đăng nhập: " + auth.getName() + " - Quyền: " + auth.getAuthorities();
        }
    }

    @GetMapping("/login")
    public String loginPage(HttpSession session) {
        if (session.getAttribute("currentUser") != null)
            return "redirect:/";
        if (session.getAttribute("currentStaff") != null)
            return "redirect:/admin/dashboard";
        return "auth/login";
    }

    @PostMapping("/login")
    @ResponseBody
    public ResponseEntity<?> handleUnifiedLogin(@RequestParam(name = "identifier", required = false) String identifier,
            @RequestParam(name = "password", required = false) String password, HttpSession session) {

        Map<String, String> response = new HashMap<>();

        if (identifier == null || identifier.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("{\"message\": \"Vui lòng nhập đầy đủ thông tin!\"}");
        }

        Customer customer = customerService.login(identifier, password);
        if (customer != null) {
            session.setAttribute("currentUser", customer);
            session.setMaxInactiveInterval(30 * 60);

            response.put("status", "success");
            response.put("redirectUrl", "/dinio");
            return ResponseEntity.ok(response);
        }

        StaffUser staff = staffService.loginStaff(identifier, password);
        if (staff != null) {
            if (staff.getRole() == null || staff.getRole().getName() == null) {
                return ResponseEntity.badRequest().body("{\"message\": \"Tài khoản chưa được cấp quyền!\"}");
            }

            session.setAttribute("currentStaff", staff);
            session.setMaxInactiveInterval(8 * 60 * 60);

            String dashboardUrl = determineRedirectUrl(staff.getRole().getName());

            response.put("status", "success");
            response.put("redirectUrl", dashboardUrl);
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body("{\"message\": \"Tài khoản hoặc mật khẩu không đúng!\"}");
    }

    private String determineRedirectUrl(RoleName roleName) {
        switch (roleName) {
            case ADMIN:
                return "/admin/dashboard";
            case KITCHEN:
                return "/kitchen/orders";
            case CASHIER_MANAGER:
                return "/cashier/orders";
            case WAITER:
                return "/waiter/tables";
            default:
                return "/admin/home";
        }
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login?logout";
    }

    @GetMapping("/register")
    public String register() {
        return "auth/register";
    }

    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "auth/forgot-password";
    }
    @GetMapping("/profile")
public String profilePage() {
    return "customer/profile";
}

}
