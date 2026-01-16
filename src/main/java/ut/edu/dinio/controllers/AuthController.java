package ut.edu.dinio.controllers;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

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
        @RequestParam(name = "password", required = false) String password, HttpSession session, HttpServletRequest request,HttpServletResponse response) {

        Map<String, String> resp = new HashMap<>();
        SecurityContextRepository repo = new HttpSessionSecurityContextRepository();

        if (identifier == null || identifier.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("{\"message\": \"Vui lòng nhập đầy đủ thông tin!\"}");
        }

        Customer customer = customerService.login(identifier, password);
        if (customer != null) {
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                identifier, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
        
            SecurityContext sc = SecurityContextHolder.createEmptyContext();
            sc.setAuthentication(auth);
            SecurityContextHolder.setContext(sc);
            repo.saveContext(sc, request, response);
            session.setAttribute("currentUser", customer);
            session.setMaxInactiveInterval(30 * 60);

            resp.put("status", "success");
            resp.put("redirectUrl", "/dinio");
            return ResponseEntity.ok(resp);
        }

        StaffUser staff = staffService.loginStaff(identifier, password);
        if (staff != null) {
            if (staff.getRole() == null || staff.getRole().getName() == null) {
                return ResponseEntity.badRequest().body("{\"message\": \"Tài khoản chưa được cấp quyền!\"}");
            }

            UsernamePasswordAuthenticationToken authStaff = new UsernamePasswordAuthenticationToken(
                identifier, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + staff.getRole().getName().toString())));
        
            SecurityContext scStaff = SecurityContextHolder.createEmptyContext();
            scStaff.setAuthentication(authStaff);
            SecurityContextHolder.setContext(scStaff);
            repo.saveContext(scStaff, request, response);

            session.setAttribute("currentStaff", staff);
            session.setMaxInactiveInterval(8 * 60 * 60);

            String dashboardUrl = determineRedirectUrl(staff.getRole().getName());

            resp.put("status", "success");
            resp.put("redirectUrl", dashboardUrl);
            return ResponseEntity.ok(resp);
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

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login?logout";
    }

    @GetMapping("/register")
    public String register() {
        return "auth/register";
    }

    @PostMapping("/register")
    public String handleRegister( @RequestParam String fullName, @RequestParam String identifier, @RequestParam String password, @RequestParam String confirmPassword,
            Model model, RedirectAttributes redirectAttributes) {

        if (!password.equals(confirmPassword)) {
            model.addAttribute("error", "Mật khẩu xác nhận không khớp!");
            return "auth/register";
        }

        String result = customerService.registerCustomer(fullName, identifier, password);

        if ("success".equals(result)) {
            redirectAttributes.addFlashAttribute("successMessage", "Đăng ký thành công!");
            return "redirect:/login";
        } else {
            model.addAttribute("error", result);
            return "auth/register";
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

        if (user == null) return "redirect:/login";
        
        model.addAttribute("user", user);
        return "customer/profile-customer";
    }

}
