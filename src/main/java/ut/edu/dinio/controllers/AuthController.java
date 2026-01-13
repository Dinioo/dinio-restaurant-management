package ut.edu.dinio.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

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
      return "auth/login";
  } 

  @PostMapping("/login")
  public String handleLogin(@RequestParam("identifier") String identifier, @RequestParam("password") String password, HttpSession session, RedirectAttributes redirectAttributes) {
      
      Customer customer = customerService.login(identifier, password);
      if (customer != null) {
          session.setAttribute("currentUser", customer);
          return "redirect:/"; 
      } else {
          redirectAttributes.addFlashAttribute("errorMessage", "Email/SĐT hoặc mật khẩu không đúng!");
          return "redirect:/login";
      }
  }

    @PostMapping("/staff/login")
    public String handleAdminLogin(@RequestParam("identifier") String identifier, @RequestParam("password") String password,  HttpSession session,  RedirectAttributes redirectAttributes) { 
        
        StaffUser staff = staffService.loginStaff(identifier, password);
        if (staff != null) {
            session.setAttribute("currentStaff", staff);
            RoleName roleName = staff.getRole().getName(); 

            if (roleName == RoleName.ADMIN) {
                return "redirect:/admin/dashboard";
            } 
            else if (roleName == RoleName.KITCHEN) {
                return "redirect:/kitchen/orders";
            }
            else if (roleName == RoleName.CASHIER_MANAGER) {
                return "redirect:/cashier/orders";
            }  
            else if (roleName == RoleName.WAITER) { 
                return "redirect:/waiter/tables";
            }
            else {
                return "redirect:/admin/home"; 
            }

        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Tài khoản hoặc mật khẩu không đúng!");
            return "redirect:/admin/login";
        }
    }

  @GetMapping("/logout")
  public String logout(HttpSession session) {
      session.invalidate(); 
      return "redirect:/login";
  }

  @GetMapping("/register")
  public String register() {
    return "auth/register";
  }

  @GetMapping("/forgot-password")
  public String forgotPassword() {
    return "auth/forgot-password";
  }
}
