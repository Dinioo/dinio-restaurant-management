package ut.edu.dinio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ut.edu.dinio.pojo.Payment;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.repositories.PaymentRepository;

@Service
public class BillService {

    @Autowired
    private PaymentRepository paymentRepository;

    public List<Map<String, Object>> getPaidBillsByDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<Payment> payments = paymentRepository.findAllByDateWithDetails(start, end);

        return payments.stream().map(p -> {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("paidAt", p.getPaidAt().toString());
        map.put("amount", p.getAmount());
        map.put("payType", p.getMethod().name());

        String customerName = "Khách lẻ";
        boolean isPreorder = false;

        if (p.getInvoice() != null && p.getInvoice().getSession() != null) {
            TableSession session = p.getInvoice().getSession();
            Reservation res = session.getReservation();
            if (res != null) {
                isPreorder = true;
                if (res.getCustomer() != null) {
                    customerName = res.getCustomer().getFullName();
                }
            }
        }

        map.put("customerName", customerName);
        map.put("isPreorder", isPreorder);
        return map;
    }).collect(Collectors.toList());
    }

    @Transactional
    public void voidPayment(Integer paymentId) {
        if (!paymentRepository.existsById(paymentId)) {
            throw new RuntimeException("Hóa đơn không tồn tại.");
        }
        paymentRepository.deleteById(paymentId);
    }
}