package ut.edu.dinio;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

@TestMethodOrder(OrderAnnotation.class)
public class CashierTest {

    private static WebDriver driver;
    private static WebDriverWait wait;

    // ====== CONFIG ======
    private static final String BASE = "http://localhost:8080";
    private static final String LOGIN_URL = BASE + "/dinio/staff/login";
    private static final String USER = "cashier1";
    private static final String PASS = "hash_cashier";

    // Slow mode: 1s per step
    private static final long STEP_DELAY_MS = 1000;

    @BeforeAll
    static void beforeAll() {

        ChromeOptions opt = new ChromeOptions();
        // opt.addArguments("--headless=new"); // bật nếu muốn chạy headless
        opt.addArguments("--window-size=1400,900");

        driver = new ChromeDriver(opt);
        wait = new WebDriverWait(driver, Duration.ofSeconds(12));

        loginOnce();
    }

    @AfterAll
    static void afterAll() {
        if (driver != null) driver.quit();
    }

    // =========================
    // Helpers
    // =========================
    private static void stepSleep() {
        try { Thread.sleep(STEP_DELAY_MS); } catch (InterruptedException ignored) {}
    }

    private static WebElement byId(String id) {
        return wait.until(ExpectedConditions.presenceOfElementLocated(By.id(id)));
    }

    private static WebElement clickable(By by) {
        return wait.until(ExpectedConditions.elementToBeClickable(by));
    }

    private static void click(By by) {
        clickable(by).click();
        stepSleep();
    }

    private static void type(By by, String text) {
        WebElement el = clickable(by);
        el.clear();
        el.sendKeys(text);
        stepSleep();
    }

    private static boolean exists(By by) {
        return !driver.findElements(by).isEmpty();
    }

    private static void go(String url) {
        driver.get(url);
        stepSleep();
    }

    private static void assertUrlContains(String needle) {
        wait.until(d -> d.getCurrentUrl().contains(needle));
        Assertions.assertTrue(driver.getCurrentUrl().contains(needle));
    }

    private static void safeBack() {
        driver.navigate().back();
        stepSleep();
    }

    // =========================
    // Login once (reused session)
    // =========================
    private static void loginOnce() {
        go(LOGIN_URL);

        // staff-login.html có: id="identifier", id="password", id="submitBtn"
        type(By.id("identifier"), USER);
        type(By.id("password"), PASS);
        click(By.id("submitBtn"));

        // sau login thường redirect về dashboard cashier
        // chỉ cần đảm bảo đã thoát khỏi trang login
        wait.until(d -> !d.getCurrentUrl().contains("/staff/login"));
        stepSleep();
    }

    // =========================
    // Tests
    // =========================

    @Test
    @Order(1)
    void dashboard_shouldLoadAndNavigateQuickCards() {
        go(BASE + "/dinio/cashier/dashboard");
        assertUrlContains("/dinio/cashier/dashboard");

        // dashboard có các id: shiftName, statSeated... (tồn tại là pass)
        Assertions.assertTrue(exists(By.id("shiftName")));
        Assertions.assertTrue(exists(By.id("statSeated")));

        // Click nhanh 1-2 quick card bằng data-nav (nút "Sơ đồ bàn", "Hoá đơn"...)
        // Không phụ thuộc CSS, dựa vào attribute data-nav.
        List<WebElement> navButtons = driver.findElements(By.cssSelector("button[data-nav]"));
        Assertions.assertTrue(navButtons.size() > 0, "Không thấy button[data-nav] trên dashboard");

        // Click "Sơ đồ bàn" nếu có
        WebElement toTables = navButtons.stream()
                .filter(b -> (b.getAttribute("data-nav") != null) && b.getAttribute("data-nav").contains("/dinio/cashier/tables"))
                .findFirst()
                .orElse(navButtons.get(0));

        toTables.click();
        stepSleep();
        assertUrlContains("/dinio/cashier/tables");

        // quay lại dashboard
        go(BASE + "/dinio/cashier/dashboard");
        assertUrlContains("/dinio/cashier/dashboard");
    }

    @Test
    @Order(2)
    void tableMap_shouldSelectTable_openBillModal_andGoPaymentThenBack() {
        go(BASE + "/dinio/cashier/tables");
        assertUrlContains("/dinio/cashier/tables");

        // Các id theo cashier-table-map.js/html:
        // #wtmList, #btnOpenBill, #btnPay, #pickTable ...
        Assertions.assertTrue(exists(By.id("wtmList")));
        Assertions.assertTrue(exists(By.id("btnOpenBill")));
        Assertions.assertTrue(exists(By.id("btnPay")));

        // Click 1 table item trong list (selector mềm để tránh lệ thuộc class)
        WebElement list = byId("wtmList");

        // tìm phần tử có thể click trong list
        List<WebElement> candidates = list.findElements(By.cssSelector("button, [role='button'], [data-id], .wtm-item, .table-card"));
        WebElement firstClickable = candidates.stream()
                .filter(WebElement::isDisplayed)
                .findFirst()
                .orElseThrow(() -> new AssertionError("Không tìm thấy item nào để chọn trong #wtmList"));

        firstClickable.click();
        stepSleep();

        // Sau chọn, pickTable nên khác "—"
        WebElement pickTable = byId("pickTable");
        String picked = pickTable.getText().trim();
        Assertions.assertFalse(picked.equals("—") || picked.isEmpty(), "Chọn bàn nhưng pickTable vẫn là —");

        // Xem bill -> mở modal wtBillModal (dùng fragment waiter bill modal)
        WebElement btnOpenBill = byId("btnOpenBill");
        // có thể bị disabled nếu bàn chưa có bill, nên check rồi mới click
        if (btnOpenBill.isEnabled()) {
            btnOpenBill.click();
            stepSleep();

            // modal id wtBillModal
            WebElement modal = byId("wtBillModal");
            // aria-hidden="false" khi mở
            wait.until(d -> "false".equals(modal.getAttribute("aria-hidden")) || modal.getAttribute("class").contains("open") || !modal.getAttribute("class").contains("is-hidden"));

            // đóng bằng ESC
            modal.sendKeys(Keys.ESCAPE);
            stepSleep();
        }

        // Thanh toán -> thường điều hướng sang /dinio/cashier/payment?tableId=...
        WebElement btnPay = byId("btnPay");
        if (btnPay.isEnabled()) {
            btnPay.click();
            stepSleep();

            // trang payment thường có /dinio/cashier/payment
            assertUrlContains("/dinio/cashier/payment");

            // Chọn pay method (BANK) bằng data-pay
            if (exists(By.cssSelector("#payGrid button[data-pay='BANK']"))) {
                click(By.cssSelector("#payGrid button[data-pay='BANK']"));
            }

            // Mở modal xác nhận pay: click btnPay (id="btnPay") trên payment page
            // (cẩn thận: id trùng tên, nhưng lúc này đang ở payment page nên ok)
            if (exists(By.id("btnPay"))) {
                click(By.id("btnPay"));
            }

            // Đóng modal payModal bằng nút data-close=1 (tránh confirm thanh toán)
            if (exists(By.id("payModal"))) {
                WebElement payModal = byId("payModal");
                if (!payModal.getAttribute("class").contains("is-hidden")) {
                    // click nút close trong modal
                    List<WebElement> closes = payModal.findElements(By.cssSelector("[data-close='1']"));
                    if (!closes.isEmpty()) {
                        closes.get(0).click();
                        stepSleep();
                    }
                }
            }

            // back về table map bằng nút btnBack
            if (exists(By.id("btnBack"))) {
                click(By.id("btnBack"));
                assertUrlContains("/dinio/cashier/tables");
            } else {
                safeBack();
                assertUrlContains("/dinio/cashier/tables");
            }
        }
    }

    @Test
    @Order(3)
    void pending_shouldLoadAndFilterWithoutChangingData() {
        go(BASE + "/dinio/cashier/pending");
        assertUrlContains("/dinio/cashier/pending");

        // theo cashier-pending.js: q, date, slot, party, list, prevPage, nextPage, pageInfo
        Assertions.assertTrue(exists(By.id("q")));
        Assertions.assertTrue(exists(By.id("date")));
        Assertions.assertTrue(exists(By.id("slot")));
        Assertions.assertTrue(exists(By.id("party")));
        Assertions.assertTrue(exists(By.id("list")));

        // Filter nhẹ: nhập q (không cần đúng data), đổi slot/party
        type(By.id("q"), "a"); // kích hoạt filter
        click(By.id("slot"));
        // chọn option khác nếu có
        if (exists(By.cssSelector("#slot option[value='MORNING']"))) {
            new org.openqa.selenium.support.ui.Select(byId("slot")).selectByValue("MORNING");
            stepSleep();
        }
        if (exists(By.cssSelector("#party option[value='1-2']"))) {
            new org.openqa.selenium.support.ui.Select(byId("party")).selectByValue("1-2");
            stepSleep();
        }

        // Pagination click nếu enable
        if (exists(By.id("nextPage")) && byId("nextPage").isEnabled()) click(By.id("nextPage"));
        if (exists(By.id("prevPage")) && byId("prevPage").isEnabled()) click(By.id("prevPage"));

        // Không click confirm/reject để tránh đổi DB
    }

    @Test
    @Order(4)
    void bills_shouldSearchFilter_openVoidModalCancel_andViewBack() {
        go(BASE + "/dinio/cashier/bills");
        assertUrlContains("/dinio/cashier/bills");

        // theo cashier-bills.js/html: q, cblDate, payType, preType, tbody, vbModal, vbCancelBtn, vbConfirmBtn
        Assertions.assertTrue(exists(By.id("q")));
        Assertions.assertTrue(exists(By.id("cblDate")));
        Assertions.assertTrue(exists(By.id("payType")));
        Assertions.assertTrue(exists(By.id("preType")));
        Assertions.assertTrue(exists(By.id("tbody")));

        type(By.id("q"), "nguyen"); // search
        new org.openqa.selenium.support.ui.Select(byId("payType")).selectByValue(""); // all
        stepSleep();

        // nếu có row, thử bấm View (data-action=view) rồi back
        List<WebElement> viewBtns = driver.findElements(By.cssSelector("#tbody button[data-action='view']"));
        if (!viewBtns.isEmpty()) {
            viewBtns.get(0).click();
            stepSleep();
            // vào view page
            assertUrlContains("/dinio/cashier/bills/view");
            safeBack();
            assertUrlContains("/dinio/cashier/bills");
        }

        // mở modal void rồi cancel (không xóa thật)
        List<WebElement> voidBtns = driver.findElements(By.cssSelector("#tbody button[data-action='void']"));
        if (!voidBtns.isEmpty()) {
            voidBtns.get(0).click();
            stepSleep();

            if (exists(By.id("vbModal"))) {
                WebElement vbModal = byId("vbModal");
                Assertions.assertFalse(vbModal.getAttribute("class").contains("is-hidden"), "vbModal không mở");

                if (exists(By.id("vbCancelBtn"))) {
                    click(By.id("vbCancelBtn"));
                    // modal đóng lại
                    Assertions.assertTrue(byId("vbModal").getAttribute("class").contains("is-hidden"));
                }
            }
        }
    }

}
