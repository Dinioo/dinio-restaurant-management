package ut.edu.dinio.controllers;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.service.CustomerService;

@Controller
public class ForgotPasswordController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private JavaMailSender mailSender;
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping("/api/forgot-password/send-otp")
    @ResponseBody 
    public ResponseEntity<String> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập email!");
        }

        Customer customer = customerService.findByEmail(email); 
        if (customer == null) {
            return ResponseEntity.badRequest().body("Email không tồn tại trong hệ thống!");
        }

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);

        otpStorage.put(email, otp);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Mã xác thực quên mật khẩu - DINIO");
            message.setText("Mã OTP của bạn là: " + otp + "\n Mã này có hiệu lực trong 5 phút.");
            
            mailSender.send(message);
            return ResponseEntity.ok("OTP đã được gửi thành công!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi gửi mail: " + e.getMessage());
        }
    }

    @PostMapping("/api/forgot-password/verify-otp")
    @ResponseBody
    public ResponseEntity<String> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otpInput = request.get("otp");

        String serverOtp = otpStorage.get(email);
        if (serverOtp != null && serverOtp.equals(otpInput)) {
            return ResponseEntity.ok("OTP hợp lệ!");
        }
        return ResponseEntity.badRequest().body("Mã OTP không chính xác hoặc đã hết hạn!");
    }

    @PostMapping("/api/forgot-password/reset")
    @ResponseBody
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otpInput = request.get("otp");
        String newPassword = request.get("newPassword");

        if (email == null || otpInput == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Thiếu thông tin!");
        }

        String serverOtp = otpStorage.get(email);
        if (serverOtp == null || !serverOtp.equals(otpInput)) {
            return ResponseEntity.badRequest().body("Mã OTP không đúng hoặc đã hết hạn!");
        }

        Customer customer = customerService.findByEmail(email);
        if (customer != null) {

            customerService.updatePassword(customer, newPassword);
            otpStorage.remove(email);  
            return ResponseEntity.ok("Đổi mật khẩu thành công!");
        }
        
        return ResponseEntity.badRequest().body("Lỗi không tìm thấy người dùng!");
    }
}