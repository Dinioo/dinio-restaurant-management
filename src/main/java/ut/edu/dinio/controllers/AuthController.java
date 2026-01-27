package ut.edu.dinio.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    @Autowired
    private SecurityContextRepository securityContextRepository;

    @GetMapping("/who-am-i")
    @ResponseBody
    public String whoAmI(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return "Server nói: Bạn là KHÁCH (Chưa đăng nhập)";
        } else {
            return "Server nói: Bạn là USER - Tên đăng nhập: " + auth.getName() + " - Quyền: " + auth.getAuthorities();
        }
    }

    @GetMapping("/staff/login")
    public String staffLoginPage() {
        return "auth/staff-login";
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
    public ResponseEntity<?> handleUnifiedLogin(@RequestParam String identifier, @RequestParam String password,
            HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        if (identifier == null || identifier.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ thông tin!"));
        }

        Customer customer = customerService.login(identifier, password);
        if (customer != null) {
            saveSecurityContext(request, response, identifier, "USER");
            session.setAttribute("currentUser", customer);
            return ResponseEntity.ok(Map.of("status", "success", "redirectUrl", "/dinio"));
        }

        StaffUser staff = staffService.loginStaff(identifier, password);
        if (staff != null && staff.getRole() != null) {
            String roleName = staff.getRole().getName().toString();
            saveSecurityContext(request, response, identifier, roleName);
            session.setAttribute("currentStaff", staff);
            return ResponseEntity
                    .ok(Map.of("status", "success", "redirectUrl", determineRedirectUrl(staff.getRole().getName())));
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Tài khoản hoặc mật khẩu không đúng!"));
    }

    private void saveSecurityContext(HttpServletRequest request, HttpServletResponse response, String username,
            String role) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        SecurityContext sc = SecurityContextHolder.createEmptyContext();
        sc.setAuthentication(auth);
        SecurityContextHolder.setContext(sc);
        securityContextRepository.saveContext(sc, request, response);
    }

    private String determineRedirectUrl(RoleName roleName) {
        switch (roleName) {
            case ADMIN:
                return "/dinio/admin/dashboard";
            case KITCHEN:
                return "/dinio/kitchen/orders";
            case CASHIER_MANAGER:
                return "/dinio/cashier/orders";
            case WAITER:
                return "/dinio/waiter/dashboard";
            default:
                return "/dinio/admin/dashboard";
        }
    }

    @GetMapping("/register")
    public String register() {
        return "auth/register";
    }

    @PostMapping("/register")
    @ResponseBody
    public ResponseEntity<?> handleRegister(@RequestBody Map<String, String> body) {

        String fullName = body.get("fullName");
        String identifier = body.get("identifier");
        String password = body.get("password");
        String confirmPassword = body.get("confirmPassword");

        if (fullName == null || identifier == null || password == null) {
            return ResponseEntity.badRequest().body("Vui lòng nhập đầy đủ thông tin.");
        }

        if (!password.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body("Mật khẩu xác nhận không khớp!");
        }

        String result = customerService.registerCustomer(fullName, identifier, password);

        if ("success".equals(result)) {
            return ResponseEntity.ok("Đăng ký thành công!");
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "auth/forgot-password";
    }

    @GetMapping("/profile")
    public String profilePage(HttpSession session, Authentication auth, Model model) {
        Object user = session.getAttribute("currentUser");

        if (user == null && auth != null && auth.isAuthenticated()) {
            user = auth.getPrincipal();
        }

        if (user == null)
            return "redirect:/login";

        model.addAttribute("user", user);
        return "customer/profile-customer";
    }

}
