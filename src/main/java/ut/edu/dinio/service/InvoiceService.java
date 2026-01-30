package ut.edu.dinio.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ut.edu.dinio.pojo.*;
import ut.edu.dinio.pojo.enums.InvoiceStatus;
import ut.edu.dinio.pojo.enums.SessionStatus;
import ut.edu.dinio.repositories.*;

@Service
public class InvoiceService {

    @Autowired
    private TableSessionRepository sessionRepository;
    
    @Autowired
    private InvoiceRepository invoiceRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private DiningTableRepository tableRepository;

    /**
     * Lấy danh sách bàn với thông tin tổng bill
     */
    public List<Map<String, Object>> getTablesWithBillInfo() {
        List<DiningTable> tables = tableRepository.findAllByOrderByAreaIdAscCodeAsc();
        List<Map<String, Object>> result = new ArrayList<>();

        for (DiningTable table : tables) {
            Map<String, Object> tableInfo = new HashMap<>();
            tableInfo.put("id", table.getId());
            tableInfo.put("code", table.getCode());
            tableInfo.put("seats", table.getSeats());
            tableInfo.put("status", table.getStatus().name());
            tableInfo.put("areaName", table.getArea() != null ? table.getArea().getName() : "");

            // Tìm session đang mở
            Optional<TableSession> sessionOpt = sessionRepository
                .findTopByTableIdAndStatusOrderByOpenedAtDesc(table.getId(), SessionStatus.OPEN);

            if (sessionOpt.isPresent()) {
                TableSession session = sessionOpt.get();
                
                // Tính tổng tiền từ các OrderItem
                BigDecimal totalAmount = calculateSessionTotal(session.getId());
                
                tableInfo.put("hasSession", true);
                tableInfo.put("sessionId", session.getId());
                tableInfo.put("covers", session.getCovers());
                tableInfo.put("totalAmount", totalAmount);
                tableInfo.put("totalAmountFormatted", formatMoney(totalAmount));
            } else {
                tableInfo.put("hasSession", false);
                tableInfo.put("totalAmount", BigDecimal.ZERO);
                tableInfo.put("totalAmountFormatted", "0đ");
            }

            result.add(tableInfo);
        }

        return result;
    }

    /**
     * Lấy chi tiết hóa đơn cho thanh toán
     */
    public Map<String, Object> getPaymentDetail(Integer tableId) {
        DiningTable table = tableRepository.findById(tableId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn"));

        TableSession session = sessionRepository
            .findByTableIdAndStatus(tableId, SessionStatus.OPEN)
            .orElseThrow(() -> new RuntimeException("Bàn chưa có phiên phục vụ"));

        Map<String, Object> result = new HashMap<>();

        // Thông tin bàn
        result.put("tableId", table.getCode());
        result.put("tableName", table.getCode());
        result.put("areaLabel", table.getArea() != null ? table.getArea().getName() : "");
        result.put("seats", table.getSeats());
        result.put("status", "Đang phục vụ");

        // Thông tin khách hàng (nếu có reservation)
        Map<String, Object> customerInfo = new HashMap<>();
        Reservation reservation = session.getReservation();
        if (reservation != null) {
            Customer customer = reservation.getCustomer();
            customerInfo.put("name", customer.getFullName());
            customerInfo.put("phone", customer.getPhone());
            customerInfo.put("tier", "VIP"); // Có thể mở rộng với tier system
            customerInfo.put("tierLabel", "VIP");
        } else {
            customerInfo.put("name", "Khách lẻ");
            customerInfo.put("phone", "—");
            customerInfo.put("tier", "REGULAR");
            customerInfo.put("tierLabel", "Khách thường");
        }
        result.put("customer", customerInfo);

        // Danh sách món
        List<Map<String, Object>> items = new ArrayList<>();
        List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(session.getId());
        
        for (Order order : orders) {
            List<OrderItem> orderItems = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
            
            for (OrderItem oi : orderItems) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", oi.getId());
                item.put("name", oi.getMenuItem().getName());
                item.put("qty", oi.getQty());
                item.put("unitPrice", oi.getUnitPrice());
                item.put("lineTotal", oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQty())));
                item.put("note", oi.getNote());
                item.put("status", oi.getStatus().name());
                items.add(item);
            }
        }
        result.put("items", items);

        // Tính toán
        BigDecimal subtotal = items.stream()
            .map(i -> (BigDecimal) i.get("lineTotal"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // VAT 8%, Service 5%
        BigDecimal vat = subtotal.multiply(new BigDecimal("0.08"));
        BigDecimal service = subtotal.multiply(new BigDecimal("0.05"));
        
        // Discount (VIP 10% nếu có)
        BigDecimal discountRate = customerInfo.get("tier").equals("VIP") 
            ? new BigDecimal("0.10") 
            : BigDecimal.ZERO;
        BigDecimal discount = subtotal.multiply(discountRate);
        
        BigDecimal total = subtotal.add(vat).add(service).subtract(discount);

        result.put("subtotal", subtotal);
        result.put("vat", vat);
        result.put("service", service);
        result.put("discount", discount);
        result.put("total", total);
        
        result.put("note", session.getReservation() != null 
            ? session.getReservation().getNote() 
            : "");
        
        result.put("billId", "B" + String.format("%06d", session.getId()));

        return result;
    }

    /**
     * Tạo hoặc lấy Invoice cho session
     */
    @Transactional
    public Invoice getOrCreateInvoice(Integer sessionId) {
        TableSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session không tồn tại"));

        // Kiểm tra đã có invoice chưa
        if (session.getInvoice() != null) {
            return session.getInvoice();
        }

        // Tạo invoice mới
        Invoice invoice = new Invoice(session);
        invoice.setStatus(InvoiceStatus.OPEN);
        
        // Tạo InvoiceLines từ OrderItems
        List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        BigDecimal subtotal = BigDecimal.ZERO;
        
        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
            for (OrderItem oi : items) {
                InvoiceLine line = new InvoiceLine(invoice, oi, oi.getQty(), oi.getUnitPrice());
                invoice.getLines().add(line);
                subtotal = subtotal.add(oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQty())));
            }
        }

        // Tính toán
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.08"));
        BigDecimal serviceCharge = subtotal.multiply(new BigDecimal("0.05"));
        
        invoice.setSubtotal(subtotal);
        invoice.setTax(tax);
        invoice.setServiceCharge(serviceCharge);
        invoice.setTotal(subtotal.add(tax).add(serviceCharge));

        return invoiceRepository.save(invoice);
    }

    /**
     * Xử lý thanh toán
     */
    @Transactional
    public Map<String, Object> processPayment(Integer tableId, String paymentMethod, BigDecimal amount) {
        DiningTable table = tableRepository.findById(tableId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn"));

        TableSession session = sessionRepository
            .findByTableIdAndStatus(tableId, SessionStatus.OPEN)
            .orElseThrow(() -> new RuntimeException("Bàn chưa có phiên phục vụ"));

        // Lấy hoặc tạo invoice
        Invoice invoice = getOrCreateInvoice(session.getId());
        
        // Tạo payment
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setMethod(ut.edu.dinio.pojo.enums.PaymentMethod.valueOf(paymentMethod));
        payment.setAmount(amount);
        payment.setPaidAt(LocalDateTime.now());
        payment.setRefNo("TXN-" + System.currentTimeMillis());
        
        invoice.getPayments().add(payment);
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        // Đóng session
        session.setStatus(SessionStatus.CLOSED);
        session.setClosedAt(LocalDateTime.now());
        sessionRepository.save(session);

        // Cập nhật bàn
        table.setStatus(ut.edu.dinio.pojo.enums.TableStatus.CLEANING);
        tableRepository.save(table);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("invoiceId", invoice.getId());
        result.put("paymentId", payment.getId());
        result.put("message", "Thanh toán thành công");

        return result;
    }

    // Helper methods
    private BigDecimal calculateSessionTotal(Integer sessionId) {
        List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        BigDecimal total = BigDecimal.ZERO;

        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
            for (OrderItem item : items) {
                total = total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQty())));
            }
        }

        return total;
    }

    private String formatMoney(BigDecimal amount) {
        return String.format("%,.0fđ", amount);
    }
}