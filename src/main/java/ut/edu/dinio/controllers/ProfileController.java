package ut.edu.dinio.controllers;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.service.CustomerService;

@Controller
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    private CustomerService customerService;

    @GetMapping("/me")
    public String profilePage(HttpSession session) {
        if (session.getAttribute("currentUser") == null) return "redirect:/login";
        return "customer/profile-customer";
    }

    @GetMapping("/api/data")
    @ResponseBody
    public ResponseEntity<?> getProfileData(HttpSession session) {
        Customer current = (Customer) session.getAttribute("currentUser");
        if (current == null) return ResponseEntity.status(401).build();

        Customer user = customerService.getById(current.getId());
        Map<String, Object> map = new HashMap<>();
        
        map.put("fullName", user.getFullName());
        map.put("phone", user.getPhone());
        map.put("email", user.getEmail());
        map.put("code", "DN-" + user.getId());
        map.put("joinDate", user.getCreatedAt().toLocalDate().toString());

        map.put("points", 0);
        map.put("tier", "Premium Member");
        map.put("dob", "N/A");
        map.put("gender", "N/A");
        map.put("address", "N/A");
        map.put("note", "N/A");
        map.put("avatarUrl", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80");

        return ResponseEntity.ok(map);
    }

    @PostMapping("/api/update")
    @ResponseBody
    public ResponseEntity<?> update(@RequestBody Map<String, String> body, HttpSession session) {
        Customer current = (Customer) session.getAttribute("currentUser");
        Customer updated = customerService.updateProfile(current.getId(), body.get("fullName"), body.get("phone"));
        session.setAttribute("currentUser", updated);
        return ResponseEntity.ok("success");
    }

    @PostMapping("/api/change-email")
    @ResponseBody
    public ResponseEntity<?> changeEmail(@RequestBody Map<String, String> body, HttpSession session) {
        Customer current = (Customer) session.getAttribute("currentUser");
        String result = customerService.updateEmail(current.getId(), body.get("newEmail"), body.get("password"));
        if ("success".equals(result)) {
            current.setEmail(body.get("newEmail"));
            return ResponseEntity.ok("success");
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/api/change-password")
    @ResponseBody
    public ResponseEntity<?> changePwd(@RequestBody Map<String, String> body, HttpSession session) {
        Customer current = (Customer) session.getAttribute("currentUser");
        String result = customerService.updatePassword(current.getId(), body.get("oldPwd"), body.get("newPwd"));
        return "success".equals(result) ? ResponseEntity.ok("success") : ResponseEntity.badRequest().body(result);
    }
}