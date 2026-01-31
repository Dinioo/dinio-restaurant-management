package ut.edu.dinio.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ut.edu.dinio.pojo.Invoice;
import ut.edu.dinio.pojo.enums.InvoiceStatus;
import ut.edu.dinio.pojo.enums.OrderStatus;
import ut.edu.dinio.pojo.enums.PaymentMethod;
import ut.edu.dinio.pojo.enums.ReservationStatus;
import ut.edu.dinio.pojo.enums.SessionStatus;
import ut.edu.dinio.repositories.InvoiceRepository;
import ut.edu.dinio.repositories.OrderRepository;
import ut.edu.dinio.repositories.ReservationRepository;
import ut.edu.dinio.repositories.TableSessionRepository;

@Service
public class DashboardService {
    @Autowired private TableSessionRepository sessionRepo;
    @Autowired private InvoiceRepository invoiceRepo;
    @Autowired private OrderRepository orderRepo;
    @Autowired private ReservationRepository resRepo;

    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.with(LocalTime.MIN);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        
        LocalDateTime startTime = now.withHour(9).withMinute(0).withSecond(0).withNano(0);
        Duration diff = Duration.between(startTime, now);
        long h = Math.max(0, diff.toHours());
        long m = Math.max(0, diff.toMinutesPart());
        data.put("shiftWorked", h + "h" + m + "’");

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay(); 
        List<Invoice> invoicesToday = invoiceRepo.findAllInvoicesOfToday(startOfToday);
        long bills = 0;
        BigDecimal revenue = BigDecimal.ZERO;

        for (Invoice inv : invoicesToday) {
            boolean isPaid = inv.getPayments().stream()
                .anyMatch(p -> p.getMethod() == PaymentMethod.CASH || p.getMethod() == PaymentMethod.TRANSFER || p.getMethod() == PaymentMethod.BANK || p.getMethod() == PaymentMethod.VNPAY);
            
            if (isPaid) {
                bills++;
                revenue = revenue.add(inv.getTotal() != null ? inv.getTotal() : BigDecimal.ZERO);
            }
        }
        data.put("shiftBills", bills);
        data.put("shiftRevenue", String.format("%,.0fđ", revenue));

        long seated = sessionRepo.findByStatusAndOpenedAtAfter(SessionStatus.OPEN, todayStart).size();
        data.put("statSeated", seated);

        data.put("statNeedOrder", orderRepo.countTablesWithSentOrders(OrderStatus.SENT, SessionStatus.OPEN));

        long paying = invoicesToday.stream()
            .filter(i -> i.getStatus() == InvoiceStatus.OPEN && i.getSession().getStatus() == SessionStatus.OPEN)
            .count();
        data.put("statPaying", paying);

        long cancelledReservations = resRepo.countByStatusAndCreatedAtAfter(ReservationStatus.CANCELLED, startOfDay);
    data.put("statCancelled", cancelledReservations);

        return data;
    }
}