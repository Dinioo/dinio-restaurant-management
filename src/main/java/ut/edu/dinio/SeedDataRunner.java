package ut.edu.dinio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import ut.edu.dinio.pojo.Area;
import ut.edu.dinio.pojo.AuditLog;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.DiningTable;
import ut.edu.dinio.pojo.Discount;
import ut.edu.dinio.pojo.Invoice;
import ut.edu.dinio.pojo.InvoiceLine;
import ut.edu.dinio.pojo.KitchenTicket;
import ut.edu.dinio.pojo.MenuCategory;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.Order;
import ut.edu.dinio.pojo.OrderItem;
import ut.edu.dinio.pojo.Payment;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.pojo.Role;
import ut.edu.dinio.pojo.StaffUser;
import ut.edu.dinio.pojo.TableSession;
import ut.edu.dinio.pojo.TicketItem;
import ut.edu.dinio.pojo.enums.DiscountType;
import ut.edu.dinio.pojo.enums.InvoiceStatus;
import ut.edu.dinio.pojo.enums.ItemTag;
import ut.edu.dinio.pojo.enums.OrderItemStatus;
import ut.edu.dinio.pojo.enums.OrderStatus;
import ut.edu.dinio.pojo.enums.PaymentMethod;
import ut.edu.dinio.pojo.enums.PermissionCode;
import ut.edu.dinio.pojo.enums.ReservationStatus;
import ut.edu.dinio.pojo.enums.RoleName;
import ut.edu.dinio.pojo.enums.SessionStatus;
import ut.edu.dinio.pojo.enums.SpiceLevel;
import ut.edu.dinio.pojo.enums.TableStatus;
import ut.edu.dinio.pojo.enums.TicketStatus;

@Component
public class SeedDataRunner implements CommandLineRunner {

    @PersistenceContext
    private EntityManager em;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // Check if data already exists
        Long existingCats = em.createQuery("select count(c) from MenuCategory c", Long.class)
                              .getSingleResult();
        if (existingCats != null && existingCats > 0) {
            System.out.println("⏭️ Seed skipped (MenuCategory already exists).");
            return;
        }

        // =========================================================
        // 1) Areas + Tables
        // =========================================================
        Area floor1 = new Area("Tầng 1");
        Area floor2 = new Area("Tầng 2");
        Area vip = new Area("VIP");

        floor1.getTables().add(new DiningTable(floor1, "F1-01", 2));
        floor1.getTables().add(new DiningTable(floor1, "F1-02", 4));
        floor1.getTables().add(new DiningTable(floor1, "F1-03", 6));

        floor2.getTables().add(new DiningTable(floor2, "F2-01", 2));
        floor2.getTables().add(new DiningTable(floor2, "F2-02", 4));
        floor2.getTables().add(new DiningTable(floor2, "F2-03", 8));

        vip.getTables().add(new DiningTable(vip, "VIP-01", 6));
        vip.getTables().add(new DiningTable(vip, "VIP-02", 10));

        em.persist(floor1);
        em.persist(floor2);
        em.persist(vip);

        DiningTable tableF102 = floor1.getTables().get(1);
        DiningTable tableVIP01 = vip.getTables().get(0);

        tableVIP01.setStatus(TableStatus.IN_SERVICE);
        tableF102.setStatus(TableStatus.AVAILABLE);

        // =========================================================
        // 2) Menu Categories + Items 
        // =========================================================
        MenuCategory catStarters = new MenuCategory("Starters", 1);
        MenuCategory catMain = new MenuCategory("Main", 2);
        MenuCategory catDesserts = new MenuCategory("Desserts", 3);
        MenuCategory catDrinks = new MenuCategory("Drinks", 4);

        // Starters
        catStarters.getItems().add(mi(catStarters,"Bruschetta","Bánh mì nướng, cà chua, basil.", bd(79000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005761/food1_dtc686.jpg", tags(ItemTag.NEW), "Bread, tomato, basil", 320, SpiceLevel.NOT_SPICY));

        catStarters.getItems().add(mi(catStarters,"Mushroom Cream Soup","Súp kem nấm béo mịn, thơm rosemary.", bd(89000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005817/starters1_xjiz2s.jpg", tags(ItemTag.PREMIUM), "Mushroom, cream, rosemary", 380, SpiceLevel.NOT_SPICY));

        catStarters.getItems().add(mi(catStarters,"Spring Rolls","Chả giò giòn rụm, dùng kèm nước chấm.", bd(79000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005818/starters2_fcivxk.jpg", tags(ItemTag.BEST), "Pork, shrimp, wrapper, herbs", 420, SpiceLevel.MILD));

        catStarters.getItems().add(mi(catStarters,"Crispy Fried Shrimp","Tôm chiên giòn, sốt chua ngọt, kèm chanh.", bd(129000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005819/starters3_phrsc6.jpg", tags(ItemTag.NEW), "Shrimp, batter, sweet&sour sauce", 560, SpiceLevel.MILD));

        catStarters.getItems().add(mi(catStarters,"French Fries","Khoai tây chiên vàng giòn, kèm mayo/ketchup.", bd(59000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005820/starters4_rv423g.jpg", tags(), "Potato, salt", 480, SpiceLevel.NOT_SPICY));

        catStarters.getItems().add(mi(catStarters,"Caesar Salad","Rau romaine, gà nướng, sốt Caesar & phô mai.", bd(109000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005821/starters5_jr61i3.jpg", tags(ItemTag.BEST), "Romaine, chicken, parmesan", 520, SpiceLevel.NOT_SPICY));

        // Main
        catMain.getItems().add(mi(catMain,"Grilled Beef Steak","Bò nướng mềm, sốt tiêu đen, dùng kèm khoai tây.", bd(259000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005763/food3_cilk4f.jpg", tags(ItemTag.SIGNATURE), "Beef, black pepper sauce, potato", 820, SpiceLevel.NOT_SPICY));

        catMain.getItems().add(mi(catMain,"Pan-Seared Salmon","Cá hồi áp chảo, sốt bơ chanh, rau củ theo mùa.", bd(239000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005816/Main5_atqozl.jpg", tags(ItemTag.BEST), "Salmon, butter lemon sauce, veggies", 760, SpiceLevel.NOT_SPICY));

        // Chef’s Pick (UI) -> map về SIGNATURE
        catMain.getItems().add(mi(catMain,"Truffle Cream Pasta","Mỳ sốt kem truffle, phô mai Parmesan.", bd(149000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005815/Main4_zrkwle.jpg", tags(ItemTag.SIGNATURE), "Pasta, truffle cream, parmesan", 690, SpiceLevel.NOT_SPICY));

        catMain.getItems().add(mi(catMain,"Herb Roasted Chicken","Gà nướng thảo mộc, da giòn, thịt mọng.", bd(169000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005814/Main3_w6wpht.jpg", tags(ItemTag.NEW), "Chicken, herbs, gravy", 740, SpiceLevel.NOT_SPICY));

        catMain.getItems().add(mi(catMain,"Garlic Shrimp Rice","Tôm xào bơ tỏi, cơm nóng, hương vị đậm đà.", bd(159000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005814/Main2_wyzvc9.jpg", tags(ItemTag.BEST), "Shrimp, garlic butter, rice", 780, SpiceLevel.MEDIUM));

        catMain.getItems().add(mi(catMain,"Mushroom Risotto","Risotto nấm Ý, béo nhẹ, phù hợp ăn chay.", bd(139000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005813/Main1_ueblhn.jpg", tags(ItemTag.PREMIUM), "Rice, mushroom", 650, SpiceLevel.NOT_SPICY));

        // Desserts
        catDesserts.getItems().add(mi(catDesserts,"Classic Tiramisu","Espresso, cacao, hậu vị nhẹ và cân bằng.", bd(99000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005822/Dessert1_xhpuj3.jpg", tags(ItemTag.BEST), "Mascarpone, espresso, cocoa", 520, SpiceLevel.NOT_SPICY));

        catDesserts.getItems().add(mi(catDesserts,"Chocolate Lava Cake","Bánh chocolate nóng chảy, dùng kèm kem vani.", bd(109000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005823/Dessert2_xbakak.jpg", tags(ItemTag.SIGNATURE), "Chocolate, vanilla ice cream", 610, SpiceLevel.NOT_SPICY));

        catDesserts.getItems().add(mi(catDesserts,"New York Cheesecake","Cheesecake mịn, béo nhẹ, sốt berry.", bd(99000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005824/Dessert3_gr4crv.jpg", tags(ItemTag.NEW), "Cream cheese, berry sauce", 560, SpiceLevel.NOT_SPICY));

        catDesserts.getItems().add(mi(catDesserts,"Vanilla Ice Cream","Kem vani mát lạnh, vị ngọt dịu.", bd(59000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005825/Dessert4_pb1eft.jpg", tags(), "Milk, vanilla", 280, SpiceLevel.NOT_SPICY));

        catDesserts.getItems().add(mi(catDesserts,"Fruit Panna Cotta","Panna cotta mịn, ăn kèm trái cây tươi theo mùa.", bd(89000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005826/Dessert5_srovtb.jpg", tags(ItemTag.PREMIUM), "Cream, fruits", 410, SpiceLevel.NOT_SPICY));

        catDesserts.getItems().add(mi(catDesserts,"Matcha Tiramisu","Tiramisu trà xanh, vị thanh nhẹ, hậu ngọt.", bd(109000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005828/Dessert6_fpff4d.jpg", tags(ItemTag.NEW), "Mascarpone, matcha", 540, SpiceLevel.NOT_SPICY));

        // Drinks
        catDrinks.getItems().add(mi(catDrinks,"Espresso","Cà phê espresso đậm vị, rang xay nguyên chất.", bd(49000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005828/Drink1_f8dbe3.jpg", tags(ItemTag.BEST), "Coffee beans", 15, SpiceLevel.NOT_SPICY));

        catDrinks.getItems().add(mi(catDrinks,"Latte","Cà phê sữa nóng, vị dịu, dễ uống.", bd(59000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005831/Drink2_jdgic8.jpg", tags(), "Coffee, milk", 180, SpiceLevel.NOT_SPICY));

        catDrinks.getItems().add(mi(catDrinks,"Fresh Orange Juice","Nước cam tươi nguyên chất, giàu vitamin C.", bd(69000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005829/Drink3_dhqmhg.jpg", tags(ItemTag.PREMIUM), "Orange", 120, SpiceLevel.NOT_SPICY));

        catDrinks.getItems().add(mi(catDrinks,"Iced Lemon Tea","Trà chanh mát lạnh, thanh nhẹ.", bd(49000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005811/Drink4_us3fgj.jpg", tags(), "Tea, lemon", 90, SpiceLevel.NOT_SPICY));

        catDrinks.getItems().add(mi(catDrinks,"Tropical Mocktail","Mocktail trái cây nhiệt đới, không cồn.", bd(89000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005812/Drink5_fmlhro.jpg", tags(ItemTag.SIGNATURE), "Pineapple, mango, citrus", 160, SpiceLevel.NOT_SPICY));

        catDrinks.getItems().add(mi(catDrinks,"Sparkling Water","Nước khoáng có gas, vị thanh mát.", bd(39000),
                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005813/Drink6_vbfaei.jpg", tags(ItemTag.NEW), "Mineral water", 0, SpiceLevel.NOT_SPICY));

        em.persist(catStarters);
        em.persist(catMain);
        em.persist(catDesserts);
        em.persist(catDrinks);

        // =========================================================
        // 3) Customers + Reservations 
        // =========================================================
        Customer c1 = new Customer(
        "Hà Nội",
        LocalDate.of(2002, 5, 1),
        "minhanh@gmail.com",
        "Lê Minh Anh",
        true,                             // gender (true = nam, false = nữ)
        null,
        null,
        "0901000111"
);
        c1.setPasswordHash(passwordEncoder.encode("hash_customer_1"));
        Customer c2 = new Customer(
        "TP.HCM",
        LocalDate.of(2001, 8, 20),
        "quochuy@gmail.com",
        "Trần Quốc Huy",
        true,
        null,
        null,
        "0902000222"
);
        c2.setPasswordHash(passwordEncoder.encode("hash_customer_2"));
        em.persist(c1);
        em.persist(c2);

        Reservation r1 = new Reservation(c1,
                LocalDateTime.now().plusDays(1).withHour(19).withMinute(0),
                4,
                "Bàn gần cửa sổ giúp mình nhé.");
        r1.setArea(floor1);
        r1.setTable(tableF102);
        r1.setStatus(ReservationStatus.PENDING);
        r1.setIsForOther(false);
        em.persist(r1);

        Reservation r2 = new Reservation(c2,
                LocalDateTime.now().plusDays(2).withHour(20).withMinute(0),
                6,
                "Sinh nhật - cần không gian riêng.");
        r2.setArea(vip);
        r2.setTable(tableVIP01);
        r2.setIsForOther(true);
        r2.setGuestName("Nguyễn Thảo");
        r2.setGuestPhone("0903000333");
        r2.setGuestNote("Vui lòng chuẩn bị bánh nhỏ.");
        r2.setStatus(ReservationStatus.CONFIRMED);
        em.persist(r2);
        // =========================================================
        // 4) Role + StaffUser
        // =========================================================
        // ===== ROLES =====
        Role waiterRole = new Role(RoleName.WAITER);
        waiterRole.getPermissions().addAll(Set.of(
                PermissionCode.OPEN_TABLE,
                PermissionCode.SEND_TO_KITCHEN
        ));

        Role kitchenRole = new Role(RoleName.KITCHEN);
        kitchenRole.getPermissions().add(PermissionCode.UPDATE_ITEM_STATUS);

        Role cashierRole = new Role(RoleName.CASHIER_MANAGER);
        cashierRole.getPermissions().add(PermissionCode.PAY_BILL);

        Role adminRole = new Role(RoleName.ADMIN);
        adminRole.getPermissions().addAll(EnumSet.allOf(PermissionCode.class));

        em.persist(waiterRole);
        em.persist(kitchenRole);
        em.persist(cashierRole);
        em.persist(adminRole);

        // ===== STAFF USERS =====
        StaffUser waiter = new StaffUser("Anna Waiter", "waiter1", passwordEncoder.encode("hash_waiter"), waiterRole);
        StaffUser kitchen = new StaffUser("Ben Kitchen", "kitchen1", passwordEncoder.encode("hash_kitchen"), kitchenRole);
        StaffUser cashier = new StaffUser("Cara Cashier", "cashier1", passwordEncoder.encode("hash_cashier"), cashierRole);
        StaffUser admin = new StaffUser("Dinio Admin", "admin", passwordEncoder.encode("hash_admin"), adminRole);

        em.persist(waiter);
        em.persist(kitchen);
        em.persist(cashier);
        em.persist(admin);

        // =========================================================
        // 5) TableSession + Order + OrderItem
        // =========================================================
        // ===== TABLE SESSION =====
        TableSession session1 = new TableSession(tableVIP01, 6, waiter);
        session1.setStatus(SessionStatus.OPEN);
        em.persist(session1);

        // ===== ORDER =====
        Order order1 = new Order(session1, waiter);
        order1.setStatus(OrderStatus.SENT);
        em.persist(order1);

        MenuItem steak = em.createQuery(
                "select m from MenuItem m where m.name = :n", MenuItem.class)
                .setParameter("n", "Grilled Beef Steak")
                .getSingleResult();

        MenuItem soup = em.createQuery(
                "select m from MenuItem m where m.name = :n", MenuItem.class)
                .setParameter("n", "Mushroom Cream Soup")
                .getSingleResult();

        // ===== ORDER ITEMS =====
        OrderItem oi1 = new OrderItem(order1, steak, 2, steak.getBasePrice(), "Medium rare");
        oi1.setStatus(OrderItemStatus.PREPARING);

        OrderItem oi2 = new OrderItem(order1, soup, 1, soup.getBasePrice(), "Không hành");
        oi2.setStatus(OrderItemStatus.QUEUED);

        em.persist(oi1);
        em.persist(oi2);

        // ===== SESSION 2: Bàn F1-02 =====
        DiningTable tableF101 = floor1.getTables().get(0); // F1-01
        tableF101.setStatus(TableStatus.IN_SERVICE);

        TableSession session2 = new TableSession(tableF101, 2, waiter);
        session2.setStatus(SessionStatus.OPEN);
        em.persist(session2);

        Order order2 = new Order(session2, waiter);
        order2.setStatus(OrderStatus.SENT);
        em.persist(order2);

        MenuItem pasta = em.createQuery(
                "select m from MenuItem m where m.name = :n", MenuItem.class)
                .setParameter("n", "Truffle Cream Pasta")
                .getSingleResult();

        MenuItem coffee = em.createQuery(
                "select m from MenuItem m where m.name = :n", MenuItem.class)
                .setParameter("n", "Espresso")
                .getSingleResult();

        OrderItem oi3 = new OrderItem(order2, pasta, 1, pasta.getBasePrice(), null);
        oi3.setStatus(OrderItemStatus.SERVED);

        OrderItem oi4 = new OrderItem(order2, coffee, 2, coffee.getBasePrice(), null);
        oi4.setStatus(OrderItemStatus.SERVED);

        em.persist(oi3);
        em.persist(oi4);

        // ===== SESSION 3: Bàn F2-01 =====
        DiningTable tableF201 = floor2.getTables().get(0); // F2-01
        tableF201.setStatus(TableStatus.IN_SERVICE);

        TableSession session3 = new TableSession(tableF201, 4, waiter);
        session3.setStatus(SessionStatus.OPEN);
        em.persist(session3);

        Order order3 = new Order(session3, waiter);
        order3.setStatus(OrderStatus.SENT);
        em.persist(order3);

        MenuItem salmon = em.createQuery(
                "select m from MenuItem m where m.name = :n", MenuItem.class)
                .setParameter("n", "Pan-Seared Salmon")
                .getSingleResult();

        MenuItem tiramisu = em.createQuery(
                "select m from MenuItem m where m.name = :n", MenuItem.class)
                .setParameter("n", "Classic Tiramisu")
                .getSingleResult();

        OrderItem oi5 = new OrderItem(order3, salmon, 2, salmon.getBasePrice(), "Well done");
        oi5.setStatus(OrderItemStatus.PREPARING);

        OrderItem oi6 = new OrderItem(order3, tiramisu, 1, tiramisu.getBasePrice(), null);
        oi6.setStatus(OrderItemStatus.QUEUED);

        em.persist(oi5);
        em.persist(oi6);

        // =========================================================
        // 6) KitchenTicket + TicketItem
        // =========================================================
        KitchenTicket ticket = new KitchenTicket(session1, order1);
        ticket.setStatus(TicketStatus.OPEN);
        em.persist(ticket);

        TicketItem ti1 = new TicketItem(ticket, oi1);
        ti1.setStatus(OrderItemStatus.PREPARING);

        TicketItem ti2 = new TicketItem(ticket, oi2);
        ti2.setStatus(OrderItemStatus.QUEUED);

        em.persist(ti1);
        em.persist(ti2);

        // =========================================================
        // 7) Invoice + InvoiceLine + Discount + Payment
        // =========================================================
        Invoice invoice = new Invoice(session1);
        invoice.setStatus(InvoiceStatus.OPEN);
        em.persist(invoice);

        // ===== INVOICE LINES =====
        InvoiceLine l1 = new InvoiceLine(invoice, oi1, oi1.getQty(), oi1.getUnitPrice());
        InvoiceLine l2 = new InvoiceLine(invoice, oi2, oi2.getQty(), oi2.getUnitPrice());

        em.persist(l1);
        em.persist(l2);

        // ===== TOTALS =====
        BigDecimal subtotal = l1.getPrice().multiply(BigDecimal.valueOf(l1.getQty()))
                .add(l2.getPrice().multiply(BigDecimal.valueOf(l2.getQty())));

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.08"));
        BigDecimal service = subtotal.multiply(new BigDecimal("0.05"));

        invoice.setSubtotal(subtotal);
        invoice.setTax(tax);
        invoice.setServiceCharge(service);

        // ===== DISCOUNT =====
        Discount discount = new Discount(
                invoice,
                DiscountType.PERCENT,
                new BigDecimal("10"),
                "VIP Discount"
        );
        em.persist(discount);

        BigDecimal discountTotal = subtotal.multiply(new BigDecimal("0.10"));
        invoice.setDiscountTotal(discountTotal);

        BigDecimal total = subtotal.add(tax).add(service).subtract(discountTotal);
        invoice.setTotal(total);

        // ===== PAYMENT =====
        Payment payment = new Payment(
                invoice,
                PaymentMethod.TRANSFER,
                total,
                "TXN-2026-0001"
        );
        em.persist(payment);

        // =========================================================
        // 8) AuditLog
        // =========================================================
        em.persist(new AuditLog(
        waiter,
        "OPEN_TABLE",
        "TableSession",
        session1.getId(),
        "{\"table\":\"VIP-01\",\"covers\":6}"
        ));

        em.persist(new AuditLog(
                waiter,
                "SEND_TO_KITCHEN",
                "Order",
                order1.getId(),
                "{\"items\":2}"
        ));

        em.persist(new AuditLog(
                cashier,
                "PAY_BILL",
                "Invoice",
                invoice.getId(),
                "{\"amount\":\"" + total + "\"}"
        ));


        System.out.println("Seed data done (Spring Boot JPA).");
    }
        


    // ===== helpers =====
    private static BigDecimal bd(long vnd) { return new BigDecimal(vnd); }

    private static Set<ItemTag> tags(ItemTag... t) {
        if (t == null || t.length == 0) return EnumSet.noneOf(ItemTag.class);
        return EnumSet.of(t[0], t);
    }

    private static MenuItem mi(
            MenuCategory category,
            String name,
            String description,
            BigDecimal basePrice,
            String imageUrl,
            Set<ItemTag> itemTags,
            String ingredients,
            Integer calories,
            SpiceLevel spiceLevel
    ) {
        return new MenuItem(
                category,
                name,
                description,
                basePrice,
                imageUrl,
                itemTags,
                ingredients,
                calories,
                spiceLevel,
                true,   // isActive
                true    // isAvailable
        );
    }
}
