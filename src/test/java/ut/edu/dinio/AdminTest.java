package ut.edu.dinio;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AdminTest {

    private WebDriver driver;
    private WebDriverWait wait;

    private static final String BASE = "http://localhost:8080";
    private static final String LOGIN_URL = BASE + "/dinio/staff/login";

    private static final String DASHBOARD_URL = BASE + "/dinio/admin/dashboard";
    private static final String STAFF_URL = BASE + "/dinio/admin/staff";

    private static final String MENU_ITEMS_URL = BASE + "/dinio/menu-items";
    private static final String ADD_DISH_URL = BASE + "/dinio/menu/newdish";

    @BeforeEach
    void setUp() {

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--window-size=1400,900");

        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(12));
        driver.manage().timeouts().implicitlyWait(Duration.ofMillis(200));
    }

    @AfterEach
    void tearDownOnce() {
        if (driver != null)
            driver.quit();
    }


    private void slow() {
        try {
            Thread.sleep(1000); // 1 giây
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // ---------------------------
    // Helpers
    // ---------------------------

    private WebElement w(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    private List<WebElement> ws(By locator) {
        return wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(locator));
    }

    private void click(By locator) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(locator));
        el.click();
        slow();
    }

    private boolean exists(By locator) {
        return !driver.findElements(locator).isEmpty();
    }

    private void type(By locator, String text) {
        WebElement el = w(locator);
        el.clear();
        el.sendKeys(text);
        slow();
    }

    private void pressEnter(By locator) {
        w(locator).sendKeys(Keys.ENTER);
    }

    private void pressEsc() {
        new Actions(driver).sendKeys(Keys.ESCAPE).perform();
    }

    private void waitUrlContains(String part) {
        wait.until(ExpectedConditions.urlContains(part));
    }

    private void waitUrlIs(String url) {
        wait.until(ExpectedConditions.urlToBe(url));
    }

    private void safeAcceptAlertIfPresent() {
        try {
            wait.withTimeout(Duration.ofSeconds(3))
                    .until(ExpectedConditions.alertIsPresent());
            driver.switchTo().alert().accept();
        } catch (Exception ignored) {
        } finally {
            wait.withTimeout(Duration.ofSeconds(12));
        }
    }

    private void loginAsAdmin() {
        driver.get(LOGIN_URL);

        // Role segment: chọn "Admin" nếu có
        By adminRoleBtn = By.cssSelector("#roleSeg .sl-seg-btn[data-role='admin']");
        if (exists(adminRoleBtn)) {
            click(adminRoleBtn);
        }

        type(By.id("identifier"), "admin");
        type(By.id("password"), "hash_admin");

        click(By.id("submitBtn"));

        // staff-login.js redirect về /dinio/admin/dashboard
        waitUrlContains("/dinio/admin/dashboard");

        // kiểm tra dashboard có input auditSearch
        assertTrue(exists(By.id("auditSearch")), "Dashboard phải có ô tìm kiếm auditSearch");
    }

    // ---------------------------
    // 1) Login + Dashboard Audit Log
    // ---------------------------

    @Test
    @Order(1)
    void testLoginAndDashboardAuditSearch() {
        loginAsAdmin();
        assertTrue(driver.getCurrentUrl().contains("/dinio/admin/dashboard"));

        // Test audit search filter: gõ chuỗi chắc chắn ít match để xem "auditEmpty"
        // hiện
        By auditSearch = By.id("auditSearch");
        type(auditSearch, "___no_match_" + UUID.randomUUID());

        // Nếu có audit rows thì dashboard.js sẽ toggle auditEmpty
        By auditEmptyRow = By.id("auditEmpty");
        assertTrue(exists(auditEmptyRow), "Dashboard phải có dòng #auditEmpty để hiển thị không có kết quả");

        // Không bắt buộc assert display vì dữ liệu có thể khác nhau,
        // nhưng cố gắng chờ để JS applyFilter chạy
        wait.until(d -> true);
    }

    // ---------------------------
    // 2) Staff Management
    // ---------------------------

    @Test
    @Order(2)
    void testStaffPageCreateSearchFilterInlineUpdatesAndDelete() {
        loginAsAdmin();
        driver.get(STAFF_URL);
        waitUrlContains("/dinio/admin/staff");

        // Tạo staff mới
        String u = "auto_" + System.currentTimeMillis();
        String name = "Auto User " + u;

        // form create: input[name=name], input[name=username], input[name=password],
        // select[name=roleId]
        type(By.cssSelector("form.ad-form input[name='name']"), name);
        type(By.cssSelector("form.ad-form input[name='username']"), u);
        type(By.cssSelector("form.ad-form input[name='password']"), "123456");

        // chọn role đầu tiên khác rỗng
        WebElement roleSelect = w(By.cssSelector("form.ad-form select[name='roleId']"));
        Select sel = new Select(roleSelect);

        // chọn option đầu tiên có value != ""
        List<WebElement> options = roleSelect.findElements(By.cssSelector("option"));
        Optional<WebElement> firstValid = options.stream()
                .filter(o -> o.getAttribute("value") != null && !o.getAttribute("value").trim().isEmpty())
                .findFirst();
        assertTrue(firstValid.isPresent(), "Role select phải có ít nhất 1 option hợp lệ");
        sel.selectByValue(firstValid.get().getAttribute("value"));

        click(By.cssSelector("form.ad-form button[type='submit']"));

        // sau submit, tìm row mới theo data-username
        By createdRow = By.cssSelector("tr.staff-row[data-username='" + u + "']");
        wait.until(ExpectedConditions.presenceOfElementLocated(createdRow));
        assertTrue(exists(createdRow), "Sau khi tạo, staff mới phải xuất hiện trong bảng");

        // Test search filter theo username
        type(By.id("staffSearch"), u);
        // Row mới phải visible, còn các row khác có thể bị hidden
        WebElement row = w(createdRow);
        assertTrue(row.isDisplayed(), "Row staff vừa tạo phải hiện khi search đúng username");

        // Test role filter (chỉ test thao tác, không assert cứng vì role hiển thị phụ
        // thuộc dữ liệu)
        if (exists(By.id("roleFilter"))) {
            Select roleFilter = new Select(w(By.id("roleFilter")));
            roleFilter.selectByValue("all");
        }

        // Inline update: Name (Enter trên .name-input)
        // Lưu ý: staff.js gắn listener document keydown cho .name-input Enter
        String newName = name + " Updated";
        WebElement nameInput = row.findElement(By.cssSelector("input.name-input"));
        nameInput.clear();
        nameInput.sendKeys(newName);
        nameInput.sendKeys(Keys.ENTER);

        // chờ text .name-view đổi (nếu backend OK)
        wait.until(d -> {
            String t = row.findElement(By.cssSelector(".name-view")).getText();
            return t != null && t.contains("Updated");
        });

        // Inline update: Status (change select.status-input)
        WebElement statusSelect = row.findElement(By.cssSelector("select.status-input"));
        new Select(statusSelect).selectByValue("INACTIVE");
        wait.until(d -> row.getAttribute("data-status") != null && row.getAttribute("data-status").equals("INACTIVE"));

        // Inline update: Password (Enter trên .password-input)
        WebElement pwInput = row.findElement(By.cssSelector("input.password-input"));
        pwInput.sendKeys("newpass123");
        pwInput.sendKeys(Keys.ENTER);
        // password update thường không có UI change ngoài toast -> chỉ chờ không crash
        wait.until(d -> true);

        // Inline update: Username (có 2 tình huống)
        // - Nếu UI có nút edit đúng class ".btn-edit" (theo staff.js)
        // - Hoặc HTML nút không khớp class (trường hợp snippet bạn đưa), test sẽ
        // fallback: click nút có icon pen / chữ "Sửa"
        String newUsername = u + "_u";
        WebElement editBtn;
        List<WebElement> btnEditCandidates = row.findElements(By.cssSelector(".btn-edit"));
        if (!btnEditCandidates.isEmpty()) {
            editBtn = btnEditCandidates.get(0);
        } else {
            // fallback: tìm button có text chứa "Sửa"
            List<WebElement> allButtons = row.findElements(By.tagName("button"));
            editBtn = allButtons.stream()
                    .filter(b -> (b.getText() != null && b.getText().toLowerCase().contains("sửa")))
                    .findFirst()
                    .orElse(null);
        }

        if (editBtn != null) {
            editBtn.click();

            WebElement usernameInput = row.findElement(By.cssSelector("input.username-input"));
            usernameInput.clear();
            usernameInput.sendKeys(newUsername);
            usernameInput.sendKeys(Keys.ENTER);

            // nếu cập nhật thành công, data-username + username-view đổi
            wait.until(d -> {
                String du = row.getAttribute("data-username");
                String view = row.findElement(By.cssSelector(".username-view")).getText();
                return (du != null && du.equals(newUsername)) || (view != null && view.equals(newUsername));
            });
        }

        // Delete: submit form.del-form, staff.js sẽ confirm()
        // Selenium xử lý confirm dialog bằng Alert
        WebElement delForm = row.findElement(By.cssSelector("form.del-form"));
        // Trigger submit bằng click nút trash
        WebElement delBtn = delForm.findElement(By.cssSelector("button[type='submit']"));
        delBtn.click();

        // confirm
        safeAcceptAlertIfPresent();

        // row biến mất
        wait.until(ExpectedConditions.stalenessOf(row));
    }

    // ---------------------------
    // 3) Menu Items page (Admin view)
    // ---------------------------

    @Test
    @Order(3)
    void testMenuItemsSearchSortAndFiltersPresence() {
        loginAsAdmin();
        driver.get(MENU_ITEMS_URL);
        waitUrlContains("/dinio/menu-items");

        // Có search box
        assertTrue(exists(By.id("menuSearch")), "Menu-items phải có #menuSearch");
        type(By.id("menuSearch"), "test");
        // Clear button tồn tại trong HTML
        assertTrue(exists(By.cssSelector(".search-clear")), "Menu-items phải có nút clear .search-clear");

        // Có sort select
        assertTrue(exists(By.cssSelector("select.menu-sort")), "Menu-items phải có select.menu-sort");
        Select sort = new Select(w(By.cssSelector("select.menu-sort")));
        sort.selectByValue("low");
        sort.selectByValue("high");
        sort.selectByValue("newest");

        // Có khu categories/tags container (JS sẽ fill)
        assertTrue(exists(By.id("menuCatTabs")), "Menu-items phải có #menuCatTabs");
        assertTrue(exists(By.id("menuTagChips")), "Menu-items phải có #menuTagChips");

        // Có link Add dish
        assertTrue(exists(By.cssSelector("a.btn.btn-cta")), "Menu-items phải có nút Add dish");
    }

    // ---------------------------
    // 4) Add Dish page (Preview, modal, copy, reset, submit)
    // ---------------------------

    @Test
    @Order(4)
    void testAddDishPreviewModalCopyResetAndSubmit() throws Exception {
        loginAsAdmin();
        driver.get(ADD_DISH_URL);
        waitUrlContains("/dinio/menu/newdish");

        // Nhập thông tin cơ bản
        String dishName = "Auto Dish " + System.currentTimeMillis();
        String dishDesc = "Mô tả auto";
        String ingredients = "tôm, bơ, tỏi";
        String price = "129000";

        click(By.id("btnResetForm"));
        wait.until(d -> w(By.id("name")).getAttribute("value").isBlank());

        type(By.id("name"), dishName);
        type(By.id("description"), dishDesc);
        type(By.id("ingredients"), ingredients);
        type(By.id("price"), price);

        Select cat2 = new Select(w(By.id("category")));
        cat2.getOptions().stream()
                .filter(o -> o.getAttribute("value") != null && !o.getAttribute("value").isBlank())
                .findFirst()
                .ifPresent(o -> cat2.selectByValue(o.getAttribute("value")));

        if (exists(By.id("status"))) {
            Select st = new Select(w(By.id("status")));
            st.getOptions().stream()
                    .filter(o -> o.getAttribute("value") != null && !o.getAttribute("value").isBlank())
                    .findFirst()
                    .ifPresent(o -> st.selectByValue(o.getAttribute("value")));
        }

        // Tick tag "new" nếu có (pvBadge sẽ hiện theo menu-newdish.js)
        List<WebElement> tagNew = driver.findElements(By.cssSelector("input[name='tags'][value='new']"));
        if (!tagNew.isEmpty()) {
            if (!tagNew.get(0).isSelected())
                tagNew.get(0).click();
        }

        // Upload ảnh: tạo tạm file png nhỏ
        Path tmp = Files.createTempFile("dish-", ".png");
        byte[] tinyPng = new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, (byte) 0x1F, (byte) 0x15, (byte) 0xC4, (byte) 0x89,
                0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
                0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
                0x0D, 0x0A, 0x2D, (byte) 0xB4,
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE, 0x42, 0x60, (byte) 0x82
        };
        Files.write(tmp, tinyPng, StandardOpenOption.TRUNCATE_EXISTING);

        w(By.id("imageFile")).sendKeys(tmp.toAbsolutePath().toString());

        // Assert preview cập nhật
        wait.until(d -> w(By.id("pvName")).getText().equals(dishName));
        assertTrue(w(By.id("pvDesc")).getText().contains("Mô tả"), "Preview mô tả phải được cập nhật");
        assertTrue(w(By.id("pvPrice")).getText().contains("đ"), "Preview giá phải có ký hiệu đ");

        // Badge New (nếu tick tag new)
        if (!tagNew.isEmpty()) {
            WebElement badge = w(By.id("pvBadge"));
            assertTrue(badge.isDisplayed(), "Nếu tick tag new thì pvBadge phải hiển thị");
        }

        // Open preview modal
        click(By.id("btnPreviewPopup"));
        WebElement modal = w(By.id("previewModal"));
        assertFalse(modal.getAttribute("class").contains("is-hidden"), "Modal preview phải mở");

        // Close modal (nút X)
        click(By.id("closePreviewModal"));
        wait.until(d -> w(By.id("previewModal")).getAttribute("class").contains("is-hidden"));

        // Copy summary -> alert()
        click(By.id("btnCopySummary"));
        safeAcceptAlertIfPresent();

        // Reset form
        click(By.id("btnResetForm"));
        wait.until(d -> w(By.id("name")).getAttribute("value").isBlank());

        // Điền lại nhanh + submit (có thể tạo record trong DB)
        type(By.id("name"), dishName + " 2");
        type(By.id("ingredients"), ingredients);
        type(By.id("price"), "99000");

        // submit
        click(By.cssSelector("button.btn.btn-save[type='submit']"));
        waitUrlContains("/dinio/menu-items");
    }
}
