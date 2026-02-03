package ut.edu.dinio.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional; 

import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.Invoice;
import ut.edu.dinio.pojo.InvoiceLine;
import ut.edu.dinio.pojo.Order;
import ut.edu.dinio.pojo.OrderItem;
import ut.edu.dinio.pojo.Payment;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.enums.InvoiceStatus;
import ut.edu.dinio.pojo.enums.SessionStatus;
import ut.edu.dinio.repositories.DiningTableRepository;
import ut.edu.dinio.repositories.InvoiceRepository;
import ut.edu.dinio.repositories.OrderItemRepository;
import ut.edu.dinio.repositories.OrderRepository;
import ut.edu.dinio.repositories.TableSessionRepository;

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

    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private NotificationService notificationService;

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

            Optional<TableSession> sessionOpt = sessionRepository
                .findTopByTableIdAndStatusInOrderByOpenedAtDesc(
                    table.getId(), 
                    List.of(SessionStatus.OPEN, SessionStatus.CHECK_REQUESTED)
                );

            if (sessionOpt.isPresent()) {
                TableSession session = sessionOpt.get();
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
            .findTopByTableIdAndStatusInOrderByOpenedAtDesc(
                tableId, 
                List.of(SessionStatus.OPEN, SessionStatus.CHECK_REQUESTED)
            )
            .orElseThrow(() -> new RuntimeException("Bàn chưa có phiên phục vụ"));

        Map<String, Object> result = new HashMap<>();

        result.put("tableId", table.getId()); 
        result.put("tableName", table.getCode());
        result.put("areaLabel", table.getArea() != null ? table.getArea().getName() : "");
        result.put("seats", table.getSeats());
        result.put("status", "Đang phục vụ");

        Map<String, Object> customerInfo = new HashMap<>();
        Reservation reservation = session.getReservation();
        if (reservation != null) {
            Customer customer = reservation.getCustomer();
            customerInfo.put("name", customer.getFullName());
            customerInfo.put("phone", customer.getPhone());
            customerInfo.put("tier", "VIP"); 
            customerInfo.put("tierLabel", "VIP");
        } else {
            customerInfo.put("name", "Khách lẻ");
            customerInfo.put("phone", "—");
            customerInfo.put("tier", "REGULAR");
            customerInfo.put("tierLabel", "Khách thường");
        }
        result.put("customer", customerInfo);

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

        BigDecimal subtotal = items.stream()
            .map(i -> (BigDecimal) i.get("lineTotal"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal vat = subtotal.multiply(new BigDecimal("0.08"));
        BigDecimal service = subtotal.multiply(new BigDecimal("0.05"));
        
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

        if (session.getInvoice() != null) {
            return session.getInvoice();
        }

        Invoice invoice = new Invoice(session);
        invoice.setStatus(InvoiceStatus.OPEN);
        
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
    public Map<String, Object> processPayment(Integer tableId, String paymentMethod, BigDecimal amount, StaffUser staff) {
        DiningTable table = tableRepository.findById(tableId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn"));

        TableSession session = sessionRepository
            .findTopByTableIdAndStatusInOrderByOpenedAtDesc(
                tableId, 
                List.of(SessionStatus.OPEN, SessionStatus.CHECK_REQUESTED)
            )
            .orElseThrow(() -> new RuntimeException("Bàn chưa có phiên phục vụ"));

        Invoice invoice = getOrCreateInvoice(session.getId());
        
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setMethod(ut.edu.dinio.pojo.enums.PaymentMethod.valueOf(paymentMethod));
        payment.setAmount(amount);
        payment.setPaidAt(LocalDateTime.now());
        payment.setRefNo("TXN-" + System.currentTimeMillis());
        
        invoice.getPayments().add(payment);
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        session.setStatus(SessionStatus.CLOSED);
        session.setClosedAt(LocalDateTime.now());
        sessionRepository.save(session);

        table.setStatus(ut.edu.dinio.pojo.enums.TableStatus.CLEANING);
        tableRepository.save(table);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("invoiceId", invoice.getId());
        result.put("paymentId", payment.getId());
        result.put("message", "Thanh toán thành công");

        if (session.getAssignedStaff() != null) {
            notificationService.notifyWaiterPaymentComplete(
                session.getAssignedStaff(),
                "Thanh toán hoàn tất",
                "Bàn " + table.getCode() + " đã thanh toán. Vui lòng dọn bàn.",
                tableId
            );
        }

        return result;
    }

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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Invoice generateInvoiceForCloseSession(Integer tableId, StaffUser staff) {
        TableSession session = sessionRepository
                .findTopByTableIdAndStatusInOrderByOpenedAtDesc(
                        tableId,
                        List.of(SessionStatus.OPEN, SessionStatus.CHECK_REQUESTED))
                .orElseThrow(() -> new RuntimeException("Bàn chưa có phiên phục vụ (không có session active)"));

        List<Invoice> existing = invoiceRepository.findAllBySessionIdOrderByIdDesc(session.getId());

        Invoice invoice;
        if (!existing.isEmpty()) {
            invoice = existing.get(0);
            if (existing.size() > 1) {
                for (int i = 1; i < existing.size(); i++) {
                    invoiceRepository.delete(existing.get(i));
                }
            }
            if (invoice.getSession() == null) {
                invoice.setSession(session);
            }
        } else {
            invoice = new Invoice();
            invoice.setSession(session);
            invoice.setStatus(InvoiceStatus.OPEN);
        }

        invoice.getLines().clear(); 

        List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(session.getId());
        BigDecimal subtotal = BigDecimal.ZERO;

        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
            for (OrderItem oi : items) {
                int qty = oi.getQty() == null ? 0 : oi.getQty();
                BigDecimal unit = oi.getUnitPrice() == null ? BigDecimal.ZERO : oi.getUnitPrice();

                InvoiceLine line = new InvoiceLine(invoice, oi, qty, unit);
                invoice.getLines().add(line);

                subtotal = subtotal.add(unit.multiply(BigDecimal.valueOf(qty)));
            }
        }

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.08")); 
        BigDecimal serviceCharge = subtotal.multiply(new BigDecimal("0.05")); 

        invoice.setSubtotal(subtotal);
        invoice.setTax(tax);
        invoice.setServiceCharge(serviceCharge);

        if (invoice.getDiscountTotal() == null)
            invoice.setDiscountTotal(BigDecimal.ZERO);

        BigDecimal total = subtotal.add(tax).add(serviceCharge).subtract(invoice.getDiscountTotal());
        invoice.setTotal(total);

        Invoice saved = invoiceRepository.save(invoice);
        
        session.setInvoice(saved);
        if (session.getStatus() == SessionStatus.OPEN) {
             session.setStatus(SessionStatus.CHECK_REQUESTED);
        }
        sessionRepository.save(session);

        if (staff != null) {
            auditLogService.log(
                    staff,
                    "GENERATE_INVOICE",
                    "Invoice",
                    saved.getId(),
                    Map.of("tableId", tableId, "total", total));
        }

        return saved;
    }
}