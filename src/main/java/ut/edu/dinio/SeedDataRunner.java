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
import ut.edu.dinio.pojo.ReservationItem;
import ut.edu.dinio.pojo.RestaurantInfo;
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
                Area floor3 = new Area("Tầng 3");
                Area vip = new Area("VIP");

                // --- Tầng 1 (6 bàn) ---
                floor1.getTables().add(new DiningTable(floor1, "F1-01", 2));
                floor1.getTables().add(new DiningTable(floor1, "F1-02", 4));
                floor1.getTables().add(new DiningTable(floor1, "F1-03", 6));
                floor1.getTables().add(new DiningTable(floor1, "F1-04", 2));
                floor1.getTables().add(new DiningTable(floor1, "F1-05", 4));
                floor1.getTables().add(new DiningTable(floor1, "F1-06", 8));

                // --- Tầng 2 (6 bàn) ---
                floor2.getTables().add(new DiningTable(floor2, "F2-01", 2));
                floor2.getTables().add(new DiningTable(floor2, "F2-02", 4));
                floor2.getTables().add(new DiningTable(floor2, "F2-03", 8));
                floor2.getTables().add(new DiningTable(floor2, "F2-04", 2));
                floor2.getTables().add(new DiningTable(floor2, "F2-05", 6));
                floor2.getTables().add(new DiningTable(floor2, "F2-06", 4));

                // --- Tầng 3 (6 bàn) ---
                floor3.getTables().add(new DiningTable(floor3, "F3-01", 2));
                floor3.getTables().add(new DiningTable(floor3, "F3-02", 4));
                floor3.getTables().add(new DiningTable(floor3, "F3-03", 6));
                floor3.getTables().add(new DiningTable(floor3, "F3-04", 2));
                floor3.getTables().add(new DiningTable(floor3, "F3-05", 4));
                floor3.getTables().add(new DiningTable(floor3, "F3-06", 8));

                // --- VIP (2 bàn) ---
                vip.getTables().add(new DiningTable(vip, "VIP-01", 6));
                vip.getTables().add(new DiningTable(vip, "VIP-02", 10));

                em.persist(floor1);
                em.persist(floor2);
                em.persist(floor3);
                em.persist(vip);

                // --- Extra area (no tables) to reach 5+ areas ---
                Area garden = new Area("Sân vườn");
                em.persist(garden);

                // Convenience table refs
                DiningTable tableF101 = floor1.getTables().get(0); // F1-01
                DiningTable tableF103 = floor1.getTables().get(2); // F1-03
                DiningTable tableF205 = floor2.getTables().get(4); // F2-05
                DiningTable tableF302 = floor3.getTables().get(1); // F3-02
                DiningTable tableVIP02 = vip.getTables().get(1);   // VIP-02


                DiningTable tableF102 = floor1.getTables().get(1); // F1-02
                DiningTable tableVIP01 = vip.getTables().get(0); // VIP-01

                tableVIP01.setStatus(TableStatus.IN_SERVICE);
                tableF102.setStatus(TableStatus.AVAILABLE);

                // =========================================================
                // 1b) Restaurant Info
                // =========================================================
                RestaurantInfo info = new RestaurantInfo();
                info.setName("DINIO Restaurant");
                info.setAddress("123 Nguyễn Huệ, Quận 1, TP.HCM");
                info.setPhone("028-1234-5678");
                info.setOpenHours("10:00 - 22:00");
                info.setDescription("Nhà hàng DINIO — phục vụ món Âu/Á, đặt bàn & gọi món nhanh.");
                em.persist(info);

                // Create a few more RestaurantInfo rows for demo/testing (5-10 records)
                RestaurantInfo info2 = new RestaurantInfo();
                info2.setName("DINIO Restaurant — CN Thủ Đức");
                info2.setAddress("01 Võ Văn Ngân, TP. Thủ Đức, TP.HCM");
                info2.setPhone("028-2233-4455");
                info2.setOpenHours("09:00 - 22:30");
                info2.setDescription("Chi nhánh Thủ Đức — không gian rộng, phù hợp nhóm bạn.");
                em.persist(info2);

                RestaurantInfo info3 = new RestaurantInfo();
                info3.setName("DINIO Restaurant — CN Bình Thạnh");
                info3.setAddress("88 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM");
                info3.setPhone("028-3344-5566");
                info3.setOpenHours("10:00 - 23:00");
                info3.setDescription("Chi nhánh Bình Thạnh — view thành phố, có phòng riêng.");
                em.persist(info3);

                RestaurantInfo info4 = new RestaurantInfo();
                info4.setName("DINIO Restaurant — CN Quận 7");
                info4.setAddress("12 Nguyễn Thị Thập, Quận 7, TP.HCM");
                info4.setPhone("028-4455-6677");
                info4.setOpenHours("10:00 - 22:00");
                info4.setDescription("Chi nhánh Quận 7 — phù hợp gia đình, bãi đậu xe.");
                em.persist(info4);

                RestaurantInfo info5 = new RestaurantInfo();
                info5.setName("DINIO Restaurant — CN Hà Nội");
                info5.setAddress("15 Tràng Tiền, Hoàn Kiếm, Hà Nội");
                info5.setPhone("024-7788-9900");
                info5.setOpenHours("10:30 - 22:30");
                info5.setDescription("Chi nhánh Hà Nội — phong cách Âu/Á, phục vụ nhanh.");
                em.persist(info5);


                // =========================================================
                // 2) Menu Categories + Items
                // =========================================================
                MenuCategory catStarters = new MenuCategory("Starters", 1);
                MenuCategory catMain = new MenuCategory("Main", 2);
                MenuCategory catDesserts = new MenuCategory("Desserts", 3);
                MenuCategory catDrinks = new MenuCategory("Drinks", 4);

                // Starters
                catStarters.getItems().add(mi(catStarters, "Bruschetta", "Bánh mì nướng, cà chua, basil.", bd(79000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005761/food1_dtc686.jpg",
                                tags(ItemTag.NEW), "Bread, tomato, basil", 320, SpiceLevel.NOT_SPICY));

                catStarters.getItems().add(mi(catStarters, "Mushroom Cream Soup", "Súp kem nấm béo mịn, thơm rosemary.",
                                bd(89000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005817/starters1_xjiz2s.jpg",
                                tags(ItemTag.PREMIUM), "Mushroom, cream, rosemary", 380, SpiceLevel.NOT_SPICY));

                catStarters.getItems().add(mi(catStarters, "Spring Rolls", "Chả giò giòn rụm, dùng kèm nước chấm.",
                                bd(79000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005818/starters2_fcivxk.jpg",
                                tags(ItemTag.BEST), "Pork, shrimp, wrapper, herbs", 420, SpiceLevel.MILD));

                catStarters.getItems().add(mi(catStarters, "Crispy Fried Shrimp",
                                "Tôm chiên giòn, sốt chua ngọt, kèm chanh.", bd(129000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005819/starters3_phrsc6.jpg",
                                tags(ItemTag.NEW), "Shrimp, batter, sweet&sour sauce", 560, SpiceLevel.MILD));

                catStarters.getItems().add(mi(catStarters, "French Fries",
                                "Khoai tây chiên vàng giòn, kèm mayo/ketchup.", bd(59000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005820/starters4_rv423g.jpg",
                                tags(), "Potato, salt", 480, SpiceLevel.NOT_SPICY));

                catStarters.getItems().add(mi(catStarters, "Caesar Salad",
                                "Rau romaine, gà nướng, sốt Caesar & phô mai.", bd(109000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005821/starters5_jr61i3.jpg",
                                tags(ItemTag.BEST), "Romaine, chicken, parmesan", 520, SpiceLevel.NOT_SPICY));

                // Main
                catMain.getItems().add(mi(catMain, "Grilled Beef Steak",
                                "Bò nướng mềm, sốt tiêu đen, dùng kèm khoai tây.", bd(259000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005763/food3_cilk4f.jpg",
                                tags(ItemTag.SIGNATURE), "Beef, black pepper sauce, potato", 820,
                                SpiceLevel.NOT_SPICY));

                catMain.getItems().add(mi(catMain, "Pan-Seared Salmon",
                                "Cá hồi áp chảo, sốt bơ chanh, rau củ theo mùa.", bd(239000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005816/Main5_atqozl.jpg",
                                tags(ItemTag.BEST), "Salmon, butter lemon sauce, veggies", 760, SpiceLevel.NOT_SPICY));

                catMain.getItems().add(mi(catMain, "Truffle Cream Pasta", "Mỳ sốt kem truffle, phô mai Parmesan.",
                                bd(149000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005815/Main4_zrkwle.jpg",
                                tags(ItemTag.SIGNATURE), "Pasta, truffle cream, parmesan", 690, SpiceLevel.NOT_SPICY));

                catMain.getItems().add(mi(catMain, "Herb Roasted Chicken", "Gà nướng thảo mộc, da giòn, thịt mọng.",
                                bd(169000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005814/Main3_w6wpht.jpg",
                                tags(ItemTag.NEW), "Chicken, herbs, gravy", 740, SpiceLevel.NOT_SPICY));

                catMain.getItems().add(mi(catMain, "Garlic Shrimp Rice", "Tôm xào bơ tỏi, cơm nóng, hương vị đậm đà.",
                                bd(159000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005814/Main2_wyzvc9.jpg",
                                tags(ItemTag.BEST), "Shrimp, garlic butter, rice", 780, SpiceLevel.MEDIUM));

                catMain.getItems().add(mi(catMain, "Mushroom Risotto", "Risotto nấm Ý, béo nhẹ, phù hợp ăn chay.",
                                bd(139000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005813/Main1_ueblhn.jpg",
                                tags(ItemTag.PREMIUM), "Rice, mushroom", 650, SpiceLevel.NOT_SPICY));

                // Desserts
                catDesserts.getItems().add(mi(catDesserts, "Classic Tiramisu",
                                "Espresso, cacao, hậu vị nhẹ và cân bằng.", bd(99000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005822/Dessert1_xhpuj3.jpg",
                                tags(ItemTag.BEST), "Mascarpone, espresso, cocoa", 520, SpiceLevel.NOT_SPICY));

                catDesserts.getItems().add(mi(catDesserts, "Chocolate Lava Cake",
                                "Bánh chocolate nóng chảy, dùng kèm kem vani.", bd(109000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005823/Dessert2_xbakak.jpg",
                                tags(ItemTag.SIGNATURE), "Chocolate, vanilla ice cream", 610, SpiceLevel.NOT_SPICY));

                catDesserts.getItems().add(mi(catDesserts, "New York Cheesecake", "Cheesecake mịn, béo nhẹ, sốt berry.",
                                bd(99000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005824/Dessert3_gr4crv.jpg",
                                tags(ItemTag.NEW), "Cream cheese, berry sauce", 560, SpiceLevel.NOT_SPICY));

                catDesserts.getItems().add(mi(catDesserts, "Vanilla Ice Cream", "Kem vani mát lạnh, vị ngọt dịu.",
                                bd(59000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005825/Dessert4_pb1eft.jpg",
                                tags(), "Milk, vanilla", 280, SpiceLevel.NOT_SPICY));

                catDesserts.getItems().add(mi(catDesserts, "Fruit Panna Cotta",
                                "Panna cotta mịn, ăn kèm trái cây tươi theo mùa.", bd(89000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005826/Dessert5_srovtb.jpg",
                                tags(ItemTag.PREMIUM), "Cream, fruits", 410, SpiceLevel.NOT_SPICY));

                catDesserts.getItems().add(mi(catDesserts, "Matcha Tiramisu",
                                "Tiramisu trà xanh, vị thanh nhẹ, hậu ngọt.", bd(109000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005828/Dessert6_fpff4d.jpg",
                                tags(ItemTag.NEW), "Mascarpone, matcha", 540, SpiceLevel.NOT_SPICY));

                // Drinks
                catDrinks.getItems().add(mi(catDrinks, "Espresso", "Cà phê espresso đậm vị, rang xay nguyên chất.",
                                bd(49000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005828/Drink1_f8dbe3.jpg",
                                tags(ItemTag.BEST), "Coffee beans", 15, SpiceLevel.NOT_SPICY));

                catDrinks.getItems().add(mi(catDrinks, "Latte", "Cà phê sữa nóng, vị dịu, dễ uống.", bd(59000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005831/Drink2_jdgic8.jpg",
                                tags(), "Coffee, milk", 180, SpiceLevel.NOT_SPICY));

                catDrinks.getItems().add(mi(catDrinks, "Fresh Orange Juice",
                                "Nước cam tươi nguyên chất, giàu vitamin C.", bd(69000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005829/Drink3_dhqmhg.jpg",
                                tags(ItemTag.PREMIUM), "Orange", 120, SpiceLevel.NOT_SPICY));

                catDrinks.getItems().add(mi(catDrinks, "Iced Lemon Tea", "Trà chanh mát lạnh, thanh nhẹ.", bd(49000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005811/Drink4_us3fgj.jpg",
                                tags(), "Tea, lemon", 90, SpiceLevel.NOT_SPICY));

                catDrinks.getItems().add(mi(catDrinks, "Tropical Mocktail", "Mocktail trái cây nhiệt đới, không cồn.",
                                bd(89000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005812/Drink5_fmlhro.jpg",
                                tags(ItemTag.SIGNATURE), "Pineapple, mango, citrus", 160, SpiceLevel.NOT_SPICY));

                catDrinks.getItems().add(mi(catDrinks, "Sparkling Water", "Nước khoáng có gas, vị thanh mát.",
                                bd(39000),
                                "https://res.cloudinary.com/dd8jemplj/image/upload/v1769005813/Drink6_vbfaei.jpg",
                                tags(ItemTag.NEW), "Mineral water", 0, SpiceLevel.NOT_SPICY));

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
                                true, // gender (true = nam, false = nữ)
                                null,
                                null,
                                "0901000111");
                c1.setPasswordHash(passwordEncoder.encode("hash_customer_1"));
                Customer c2 = new Customer(
                                "TP.HCM",
                                LocalDate.of(2001, 8, 20),
                                "quochuy@gmail.com",
                                "Trần Quốc Huy",
                                true,
                                null,
                                null,
                                "0902000222");
                c2.setPasswordHash(passwordEncoder.encode("hash_customer_2"));
                em.persist(c1);
                em.persist(c2);

                Customer c3 = new Customer(
                                "Đà Nẵng",
                                LocalDate.of(2000, 12, 12),
                                "thuytrang@gmail.com",
                                "Phạm Thúy Trang",
                                false,
                                null,
                                "Khách thân thiết",
                                "0903000333");
                c3.setPasswordHash(passwordEncoder.encode("hash_customer_3"));

                Customer c4 = new Customer(
                                "Cần Thơ",
                                LocalDate.of(1999, 3, 9),
                                "tienminh@gmail.com",
                                "Ngô Tiến Minh",
                                true,
                                null,
                                null,
                                "0904000444");
                c4.setPasswordHash(passwordEncoder.encode("hash_customer_4"));

                Customer c5 = new Customer(
                                "TP.HCM",
                                LocalDate.of(2003, 7, 18),
                                "ngoclan@gmail.com",
                                "Đỗ Ngọc Lan",
                                false,
                                null,
                                "Dị ứng sữa",
                                "0905000555");
                c5.setPasswordHash(passwordEncoder.encode("hash_customer_5"));

                Customer c6 = new Customer(
                                "Hà Nội",
                                LocalDate.of(1998, 11, 2),
                                "anhkhoa@gmail.com",
                                "Vũ Anh Khoa",
                                true,
                                null,
                                null,
                                "0906000666");
                c6.setPasswordHash(passwordEncoder.encode("hash_customer_6"));

                em.persist(c3);
                em.persist(c4);
                em.persist(c5);
                em.persist(c6);


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

                Reservation r3 = new Reservation(c3,
                                LocalDateTime.now().minusHours(3),
                                2,
                                "Đến sớm 1 chút.");
                r3.setArea(floor1);
                r3.setTable(tableF101);
                r3.setStatus(ReservationStatus.COMPLETED);
                r3.setIsForOther(false);
                em.persist(r3);

                Reservation r4 = new Reservation(c4,
                                LocalDateTime.now().minusMinutes(30),
                                4,
                                "Bàn thoáng, không hút thuốc.");
                r4.setArea(floor2);
                r4.setTable(tableF205);
                r4.setStatus(ReservationStatus.CONFIRMED);
                r4.setIsForOther(false);
                em.persist(r4);

                Reservation r5 = new Reservation(c5,
                                LocalDateTime.now().plusDays(3).withHour(18).withMinute(30),
                                6,
                                "Đi cùng trẻ em.");
                r5.setArea(floor3);
                r5.setTable(tableF302);
                r5.setStatus(ReservationStatus.PENDING);
                r5.setIsForOther(false);
                em.persist(r5);

                Reservation r6 = new Reservation(c6,
                                LocalDateTime.now().plusDays(1).withHour(18).withMinute(0),
                                10,
                                "Cần phòng riêng VIP-02.");
                r6.setArea(vip);
                r6.setTable(tableVIP02);
                r6.setIsForOther(true);
                r6.setGuestName("Lê Bảo Ngọc");
                r6.setGuestPhone("0907000777");
                r6.setGuestNote("Chuẩn bị ghế trẻ em (nếu có).");
                r6.setStatus(ReservationStatus.CONFIRMED);
                em.persist(r6);


                // =========================================================
                // 3b) Reservation Items (pre-order)
                // =========================================================
                MenuItem preSteak = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Grilled Beef Steak")
                                .getSingleResult();

                MenuItem preLava = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Chocolate Lava Cake")
                                .getSingleResult();

                ReservationItem ri1 = new ReservationItem(r2, preSteak, 1, preSteak.getBasePrice(), "Ít tiêu");
                ReservationItem ri2 = new ReservationItem(r2, preLava, 1, preLava.getBasePrice(), "Thêm kem vani");
                em.persist(ri1);
                em.persist(ri2);

                // Add more pre-order items for other reservations (target 5-10 ReservationItem)
                MenuItem preSalmon = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Pan-Seared Salmon")
                                .getSingleResult();

                MenuItem preTiramisu = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Classic Tiramisu")
                                .getSingleResult();

                MenuItem preSalad = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Caesar Salad")
                                .getSingleResult();

                MenuItem preLatte = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Latte")
                                .getSingleResult();

                MenuItem prePasta = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Truffle Cream Pasta")
                                .getSingleResult();

                MenuItem preChicken = em.createQuery(
                                "select m from MenuItem m where m.name = :n", MenuItem.class)
                                .setParameter("n", "Herb Roasted Chicken")
                                .getSingleResult();

                ReservationItem ri3 = new ReservationItem(r4, preSalad, 1, preSalad.getBasePrice(), "Ít sốt");
                ReservationItem ri4 = new ReservationItem(r4, preLatte, 2, preLatte.getBasePrice(), "Nóng");

                ReservationItem ri5 = new ReservationItem(r5, prePasta, 1, prePasta.getBasePrice(), "Không hành");
                ReservationItem ri6 = new ReservationItem(r5, preTiramisu, 1, preTiramisu.getBasePrice(), null);

                ReservationItem ri7 = new ReservationItem(r6, preChicken, 2, preChicken.getBasePrice(), "Thêm sốt");
                ReservationItem ri8 = new ReservationItem(r6, preSalmon, 1, preSalmon.getBasePrice(), "Ít muối");

                em.persist(ri3);
                em.persist(ri4);
                em.persist(ri5);
                em.persist(ri6);
                em.persist(ri7);
                em.persist(ri8);

                // =========================================================
                // 4) Role + StaffUser
                // =========================================================
                // ===== ROLES =====
                Role waiterRole = new Role(RoleName.WAITER);
                waiterRole.getPermissions().addAll(Set.of(
                                PermissionCode.OPEN_TABLE,
                                PermissionCode.SEND_TO_KITCHEN));

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
                StaffUser waiter = new StaffUser("Anna Waiter", "waiter1", passwordEncoder.encode("hash_waiter"),
                                waiterRole);
                StaffUser kitchen = new StaffUser("Ben Kitchen", "kitchen1", passwordEncoder.encode("hash_kitchen"),
                                kitchenRole);
                StaffUser cashier = new StaffUser("Cara Cashier", "cashier1", passwordEncoder.encode("hash_cashier"),
                                cashierRole);
                StaffUser admin = new StaffUser("Dinio Admin", "admin", passwordEncoder.encode("hash_admin"),
                                adminRole);

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

                session1.setReservation(r2);
                r2.setSession(session1);

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

                

                // =========================================================
                // 5b) More TableSessions + Orders + OrderItems (target 5-10 records per table)
                // =========================================================
                TableSession session2 = new TableSession(tableF101, 2, waiter);
                session2.setStatus(SessionStatus.CLOSED);
                session2.setOpenedAt(LocalDateTime.now().minusHours(3));
                session2.setClosedAt(LocalDateTime.now().minusHours(2));
                em.persist(session2);
                session2.setReservation(r3);
                r3.setSession(session2);

                TableSession session3 = new TableSession(tableF205, 4, waiter);
                session3.setStatus(SessionStatus.OPEN);
                em.persist(session3);
                session3.setReservation(r4);
                r4.setSession(session3);

                TableSession session4 = new TableSession(tableF302, 6, waiter);
                session4.setStatus(SessionStatus.CHECK_REQUESTED);
                em.persist(session4);

                TableSession session5 = new TableSession(tableVIP02, 10, waiter);
                session5.setStatus(SessionStatus.OPEN);
                em.persist(session5);

                // Orders
                Order order2 = new Order(session2, waiter);
                order2.setStatus(OrderStatus.DONE);
                em.persist(order2);

                Order order3 = new Order(session3, waiter);
                order3.setStatus(OrderStatus.SENT);
                em.persist(order3);

                Order order4 = new Order(session4, waiter);
                order4.setStatus(OrderStatus.SENT);
                em.persist(order4);

                Order order5 = new Order(session5, waiter);
                order5.setStatus(OrderStatus.DRAFT);
                em.persist(order5);

                // Fetch a few menu items once (for order items below)
                MenuItem salmon = preSalmon;
                MenuItem pasta = prePasta;
                MenuItem chicken = preChicken;
                MenuItem salad = preSalad;
                MenuItem latte = preLatte;
                MenuItem tiramisu = preTiramisu;

                // Order items (2 per order -> total 10)
                OrderItem oi3 = new OrderItem(order2, salad, 1, salad.getBasePrice(), null);
                oi3.setStatus(OrderItemStatus.SERVED);
                OrderItem oi4 = new OrderItem(order2, latte, 2, latte.getBasePrice(), "Ít đường");
                oi4.setStatus(OrderItemStatus.SERVED);

                OrderItem oi5 = new OrderItem(order3, steak, 1, steak.getBasePrice(), "Well done");
                oi5.setStatus(OrderItemStatus.PREPARING);
                OrderItem oi6 = new OrderItem(order3, soup, 1, soup.getBasePrice(), null);
                oi6.setStatus(OrderItemStatus.QUEUED);

                OrderItem oi7 = new OrderItem(order4, pasta, 1, pasta.getBasePrice(), "Không tiêu");
                oi7.setStatus(OrderItemStatus.PREPARING);
                OrderItem oi8 = new OrderItem(order4, salmon, 1, salmon.getBasePrice(), "Không sốt");
                oi8.setStatus(OrderItemStatus.QUEUED);

                OrderItem oi9 = new OrderItem(order5, chicken, 1, chicken.getBasePrice(), null);
                oi9.setStatus(OrderItemStatus.DRAFT);
                OrderItem oi10 = new OrderItem(order5, tiramisu, 1, tiramisu.getBasePrice(), "Thêm cacao");
                oi10.setStatus(OrderItemStatus.DRAFT);

                em.persist(oi3);
                em.persist(oi4);
                em.persist(oi5);
                em.persist(oi6);
                em.persist(oi7);
                em.persist(oi8);
                em.persist(oi9);
                em.persist(oi10);

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

                // More kitchen tickets (1 per order) + ticket items (1 per order item)
                KitchenTicket ticket2 = new KitchenTicket(session2, order2);
                ticket2.setStatus(TicketStatus.DONE);
                em.persist(ticket2);

                KitchenTicket ticket3 = new KitchenTicket(session3, order3);
                ticket3.setStatus(TicketStatus.OPEN);
                em.persist(ticket3);

                KitchenTicket ticket4 = new KitchenTicket(session4, order4);
                ticket4.setStatus(TicketStatus.OPEN);
                em.persist(ticket4);

                KitchenTicket ticket5 = new KitchenTicket(session5, order5);
                ticket5.setStatus(TicketStatus.OPEN);
                em.persist(ticket5);

                TicketItem ti3 = new TicketItem(ticket2, oi3);
                ti3.setStatus(OrderItemStatus.SERVED);
                TicketItem ti4 = new TicketItem(ticket2, oi4);
                ti4.setStatus(OrderItemStatus.SERVED);

                TicketItem ti5 = new TicketItem(ticket3, oi5);
                ti5.setStatus(OrderItemStatus.PREPARING);
                TicketItem ti6 = new TicketItem(ticket3, oi6);
                ti6.setStatus(OrderItemStatus.QUEUED);

                TicketItem ti7 = new TicketItem(ticket4, oi7);
                ti7.setStatus(OrderItemStatus.PREPARING);
                TicketItem ti8 = new TicketItem(ticket4, oi8);
                ti8.setStatus(OrderItemStatus.QUEUED);

                TicketItem ti9 = new TicketItem(ticket5, oi9);
                ti9.setStatus(OrderItemStatus.DRAFT);
                TicketItem ti10 = new TicketItem(ticket5, oi10);
                ti10.setStatus(OrderItemStatus.DRAFT);

                em.persist(ti3);
                em.persist(ti4);
                em.persist(ti5);
                em.persist(ti6);
                em.persist(ti7);
                em.persist(ti8);
                em.persist(ti9);
                em.persist(ti10);


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
                                "VIP Discount");
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
                                "TXN-2026-0001");
                em.persist(payment);

                // More invoices to reach 5 total
                Invoice invoice2 = new Invoice(session2);
                invoice2.setStatus(InvoiceStatus.PAID);
                em.persist(invoice2);

                Invoice invoice3 = new Invoice(session3);
                invoice3.setStatus(InvoiceStatus.OPEN);
                em.persist(invoice3);

                Invoice invoice4 = new Invoice(session4);
                invoice4.setStatus(InvoiceStatus.OPEN);
                em.persist(invoice4);

                Invoice invoice5 = new Invoice(session5);
                invoice5.setStatus(InvoiceStatus.OPEN);
                em.persist(invoice5);

                // Invoice lines (2 per invoice -> total 10)
                InvoiceLine l3 = new InvoiceLine(invoice2, oi3, oi3.getQty(), oi3.getUnitPrice());
                InvoiceLine l4 = new InvoiceLine(invoice2, oi4, oi4.getQty(), oi4.getUnitPrice());

                InvoiceLine l5 = new InvoiceLine(invoice3, oi5, oi5.getQty(), oi5.getUnitPrice());
                InvoiceLine l6 = new InvoiceLine(invoice3, oi6, oi6.getQty(), oi6.getUnitPrice());

                InvoiceLine l7 = new InvoiceLine(invoice4, oi7, oi7.getQty(), oi7.getUnitPrice());
                InvoiceLine l8 = new InvoiceLine(invoice4, oi8, oi8.getQty(), oi8.getUnitPrice());

                InvoiceLine l9 = new InvoiceLine(invoice5, oi9, oi9.getQty(), oi9.getUnitPrice());
                InvoiceLine l10 = new InvoiceLine(invoice5, oi10, oi10.getQty(), oi10.getUnitPrice());

                em.persist(l3);
                em.persist(l4);
                em.persist(l5);
                em.persist(l6);
                em.persist(l7);
                em.persist(l8);
                em.persist(l9);
                em.persist(l10);

                // Totals + discount + payment for each invoice
                // invoice2
                BigDecimal subtotal2 = l3.getPrice().multiply(BigDecimal.valueOf(l3.getQty()))
                                .add(l4.getPrice().multiply(BigDecimal.valueOf(l4.getQty())));
                BigDecimal tax2 = subtotal2.multiply(new BigDecimal("0.08"));
                BigDecimal service2 = subtotal2.multiply(new BigDecimal("0.05"));
                invoice2.setSubtotal(subtotal2);
                invoice2.setTax(tax2);
                invoice2.setServiceCharge(service2);
                Discount discount2 = new Discount(invoice2, DiscountType.FIXED, new BigDecimal("20000"),
                                "Voucher 20k");
                em.persist(discount2);
                BigDecimal discountTotal2 = discount2.getType() == DiscountType.PERCENT
                                ? subtotal2.multiply(discount2.getValue()).divide(new BigDecimal("100"))
                                : discount2.getValue();
                invoice2.setDiscountTotal(discountTotal2);
                BigDecimal total2 = subtotal2.add(tax2).add(service2).subtract(discountTotal2);
                invoice2.setTotal(total2);
                Payment payment2 = new Payment(invoice2, PaymentMethod.CASH, total2, "CASH-2026-0002");
                em.persist(payment2);

                // invoice3
                BigDecimal subtotal3 = l5.getPrice().multiply(BigDecimal.valueOf(l5.getQty()))
                                .add(l6.getPrice().multiply(BigDecimal.valueOf(l6.getQty())));
                BigDecimal tax3 = subtotal3.multiply(new BigDecimal("0.08"));
                BigDecimal service3 = subtotal3.multiply(new BigDecimal("0.05"));
                invoice3.setSubtotal(subtotal3);
                invoice3.setTax(tax3);
                invoice3.setServiceCharge(service3);
                Discount discount3 = new Discount(invoice3, DiscountType.PERCENT, new BigDecimal("5"),
                                "Member 5%");
                em.persist(discount3);
                BigDecimal discountTotal3 = subtotal3.multiply(discount3.getValue()).divide(new BigDecimal("100"));
                invoice3.setDiscountTotal(discountTotal3);
                BigDecimal total3 = subtotal3.add(tax3).add(service3).subtract(discountTotal3);
                invoice3.setTotal(total3);
                Payment payment3 = new Payment(invoice3, PaymentMethod.TRANSFER, total3, "TXN-2026-0003");
                em.persist(payment3);

                // invoice4
                BigDecimal subtotal4 = l7.getPrice().multiply(BigDecimal.valueOf(l7.getQty()))
                                .add(l8.getPrice().multiply(BigDecimal.valueOf(l8.getQty())));
                BigDecimal tax4 = subtotal4.multiply(new BigDecimal("0.08"));
                BigDecimal service4 = subtotal4.multiply(new BigDecimal("0.05"));
                invoice4.setSubtotal(subtotal4);
                invoice4.setTax(tax4);
                invoice4.setServiceCharge(service4);
                Discount discount4 = new Discount(invoice4, DiscountType.PERCENT, new BigDecimal("10"),
                                "Happy hour 10%");
                em.persist(discount4);
                BigDecimal discountTotal4 = subtotal4.multiply(discount4.getValue()).divide(new BigDecimal("100"));
                invoice4.setDiscountTotal(discountTotal4);
                BigDecimal total4 = subtotal4.add(tax4).add(service4).subtract(discountTotal4);
                invoice4.setTotal(total4);
                Payment payment4 = new Payment(invoice4, PaymentMethod.TRANSFER, total4, "TXN-2026-0004");
                em.persist(payment4);

                // invoice5
                BigDecimal subtotal5 = l9.getPrice().multiply(BigDecimal.valueOf(l9.getQty()))
                                .add(l10.getPrice().multiply(BigDecimal.valueOf(l10.getQty())));
                BigDecimal tax5 = subtotal5.multiply(new BigDecimal("0.08"));
                BigDecimal service5 = subtotal5.multiply(new BigDecimal("0.05"));
                invoice5.setSubtotal(subtotal5);
                invoice5.setTax(tax5);
                invoice5.setServiceCharge(service5);
                Discount discount5 = new Discount(invoice5, DiscountType.FIXED, new BigDecimal("50000"),
                                "Promo 50k");
                em.persist(discount5);
                BigDecimal discountTotal5 = discount5.getValue();
                invoice5.setDiscountTotal(discountTotal5);
                BigDecimal total5 = subtotal5.add(tax5).add(service5).subtract(discountTotal5);
                invoice5.setTotal(total5);
                Payment payment5 = new Payment(invoice5, PaymentMethod.CASH, total5, "CASH-2026-0005");
                em.persist(payment5);


                // =========================================================
                // 8) AuditLog
                // =========================================================
                em.persist(new AuditLog(
                                waiter,
                                "OPEN_TABLE",
                                "TableSession",
                                session1.getId(),
                                "{\"table\":\"VIP-01\",\"covers\":6}"));

                em.persist(new AuditLog(
                                waiter,
                                "SEND_TO_KITCHEN",
                                "Order",
                                order1.getId(),
                                "{\"items\":2}"));

                em.persist(new AuditLog(
                                cashier,
                                "PAY_BILL",
                                "Invoice",
                                invoice.getId(),
                                "{\"amount\":\"" + total + "\"}"));

                em.persist(new AuditLog(
                                waiter,
                                "OPEN_TABLE",
                                "TableSession",
                                session3.getId(),
                                "{\"table\":\"F2-05\",\"covers\":4}"));

                em.persist(new AuditLog(
                                waiter,
                                "SEND_TO_KITCHEN",
                                "Order",
                                order3.getId(),
                                "{\"items\":2}"));

                em.persist(new AuditLog(
                                cashier,
                                "PAY_BILL",
                                "Invoice",
                                invoice2.getId(),
                                "{\"amount\":\"" + invoice2.getTotal() + "\"}"));


                System.out.println("Seed data done (Spring Boot JPA).");
        }

        // ===== helpers =====
        private static BigDecimal bd(long vnd) {
                return new BigDecimal(vnd);
        }

        private static Set<ItemTag> tags(ItemTag... t) {
                if (t == null || t.length == 0)
                        return EnumSet.noneOf(ItemTag.class);
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
                        SpiceLevel spiceLevel) {
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
                                true, // isActive
                                true // isAvailable
                );
        }
}
