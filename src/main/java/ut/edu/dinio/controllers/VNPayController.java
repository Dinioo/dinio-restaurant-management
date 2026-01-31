package ut.edu.dinio.controllers;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import ut.edu.dinio.service.InvoiceService;
import ut.edu.dinio.service.VNPayService;

@Controller
@RequestMapping("/vnpay")
public class VNPayController {

    @Autowired
    private VNPayService vnPayService;

    @Autowired
    private InvoiceService invoiceService;

    /**
     * Callback từ VNPay sau khi thanh toán
     */
    @GetMapping("/callback")
    public String vnpayCallback(@RequestParam Map<String, String> params, Model model) {
        try {
            // Verify signature
            boolean isValid = vnPayService.verifyPaymentResponse(params);
            
            if (!isValid) {
                model.addAttribute("status", "error");
                model.addAttribute("message", "Chữ ký không hợp lệ");
                return "cashier/vnpay-result";
            }

            String responseCode = params.get("vnp_ResponseCode");
            String txnRef = params.get("vnp_TxnRef");
            String amount = params.get("vnp_Amount");
            
            model.addAttribute("txnRef", txnRef);
            model.addAttribute("amount", Long.parseLong(amount) / 100); // Chia 100 để trả về VND

            if ("00".equals(responseCode)) {
                // Thanh toán thành công
                Integer tableId = vnPayService.extractTableIdFromTxnRef(txnRef);
                
                if (tableId != null) {
                    // Xử lý thanh toán trong database
                    BigDecimal paymentAmount = new BigDecimal(amount).divide(new BigDecimal(100));
                    invoiceService.processPayment(
                        tableId, 
                        "BANK", 
                        paymentAmount,
                        null
                    );
                    
                    model.addAttribute("status", "success");
                    model.addAttribute("message", "Thanh toán thành công");
                    model.addAttribute("tableId", tableId);
                } else {
                    model.addAttribute("status", "error");
                    model.addAttribute("message", "Không tìm thấy thông tin bàn");
                }
            } else {
                // Thanh toán thất bại
                model.addAttribute("status", "failed");
                model.addAttribute("message", getResponseMessage(responseCode));
            }
            
            return "cashier/vnpay-result";
        } catch (Exception e) {
            model.addAttribute("status", "error");
            model.addAttribute("message", "Lỗi xử lý callback: " + e.getMessage());
            return "cashier/vnpay-result";
        }
    }

    /**
     * Mapping response code VNPay sang message
     */
    private String getResponseMessage(String responseCode) {
        Map<String, String> messages = new HashMap<>();
        messages.put("00", "Giao dịch thành công");
        messages.put("07", "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).");
        messages.put("09", "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.");
        messages.put("10", "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần");
        messages.put("11", "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.");
        messages.put("12", "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.");
        messages.put("13", "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.");
        messages.put("24", "Giao dịch không thành công do: Khách hàng hủy giao dịch");
        messages.put("51", "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.");
        messages.put("65", "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.");
        messages.put("75", "Ngân hàng thanh toán đang bảo trì.");
        messages.put("79", "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch");
        messages.put("99", "Các lỗi khác");
        
        return messages.getOrDefault(responseCode, "Lỗi không xác định");
    }
}
