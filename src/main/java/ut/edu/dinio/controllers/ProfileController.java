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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

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
        if (session.getAttribute("currentUser") == null)
            return "redirect:/login";
        return "customer/profile-customer";
    }

    @GetMapping("/api/data")
    @ResponseBody
    public ResponseEntity<?> getProfileData(HttpSession session) {
        Customer current = (Customer) session.getAttribute("currentUser");
        if (current == null)
            return ResponseEntity.status(401).build();

        Customer user = customerService.getById(current.getId());
        Map<String, Object> map = new HashMap<>();

        map.put("fullName", user.getFullName());
        map.put("phone", user.getPhone());
        map.put("email", user.getEmail());
        map.put("code", "DN-" + user.getId());
        map.put("joinDate", user.getCreatedAt().toLocalDate().toString());

        map.put("points", 0);
        map.put("tier", "Premium Member");
        map.put("dob", user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : "N/A");
        map.put("gender", user.getGender() != null ? (user.getGender() ? "Nam" : "Nữ") : "N/A");
        map.put("address", user.getAddress() != null ? user.getAddress() : "N/A");
        map.put("note", user.getNote() != null ? user.getNote() : "N/A");
        map.put("avatarUrl", user.getImageUrl() != null ? user.getImageUrl() : "https://images.unsplash.com/...");
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

    @PostMapping("/api/avatar")
    @ResponseBody
    public ResponseEntity<?> updateAvatar(
            @RequestParam("avatarFile") MultipartFile avatarFile,
            HttpSession session) {
        Customer current = (Customer) session.getAttribute("currentUser");
        if (current == null) {
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }

        try {
            Customer updated = customerService.updateAvatar(current.getId(), avatarFile);
            session.setAttribute("currentUser", updated);

            Map<String, Object> res = new HashMap<>();
            res.put("avatarUrl", updated.getImageUrl());
            return ResponseEntity.ok(res);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể cập nhật avatar");
        }
    }
}