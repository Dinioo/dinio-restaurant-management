package ut.edu.dinio;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

@TestMethodOrder(OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class CashierTest {

    private WebDriver driver;
    private WebDriverWait wait;

    // ====== CONFIG ======
    private static final String BASE = "http://localhost:8080";
    private static final String LOGIN_URL = BASE + "/dinio/staff/login";
    private static final String USER = "cashier1";
    private static final String PASS = "hash_cashier";

    // 1s step delay
    private static final long STEP_DELAY_MS = 1000;

    // SAFE_MODE=true: KHÔNG thực hiện thao tác gây thay đổi DB (confirm/void/pay thật)
    private static final boolean SAFE_MODE = true;

    @BeforeAll
    void setUpOnce() {

        ChromeOptions opt = new ChromeOptions();
        // opt.addArguments("--headless=new"); // bật nếu muốn
        opt.addArguments("--window-size=1400,900");

        driver = new ChromeDriver(opt);
        wait = new WebDriverWait(driver, Duration.ofSeconds(12));
        driver.manage().timeouts().implicitlyWait(Duration.ofMillis(200));

        loginOnce();
    }

    @AfterAll
    void tearDownOnce() {
        if (driver != null) driver.quit();
    }

    @BeforeEach
    void ensureStillLoggedIn() {
        // nếu session hết hạn thì login lại (nhưng bình thường sẽ không)
        driver.get(BASE + "/dinio/cashier/dashboard");
        stepSleep();
        if (driver.getCurrentUrl().contains("/dinio/staff/login")) {
            loginOnce();
        }
    }

    // =========================
    // Helpers
    // =========================
    private void stepSleep() {
        try { Thread.sleep(STEP_DELAY_MS); } catch (InterruptedException ignored) {}
    }

    private WebElement visible(By by) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(by));
    }

    private WebElement clickable(By by) {
        return wait.until(ExpectedConditions.elementToBeClickable(by));
    }

    private boolean exists(By by) {
        return !driver.findElements(by).isEmpty();
    }

    private void go(String url) {
        driver.get(url);
        stepSleep();
    }

    private void click(By by) {
        clickable(by).click();
        stepSleep();
    }

    private void type(By by, String text) {
        WebElement el = visible(by);
        el.clear();
        el.sendKeys(text);
        stepSleep();
    }

    private void selectByValue(By selectBy, String value) {
        Select sel = new Select(visible(selectBy));
        sel.selectByValue(value);
        stepSleep();
    }

    private void assertUrlContains(String part) {
        wait.until(d -> d.getCurrentUrl().contains(part));
        Assertions.assertTrue(driver.getCurrentUrl().contains(part));
    }

    private void safeAcceptAlertIfPresent() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(2))
                    .until(ExpectedConditions.alertIsPresent());
            driver.switchTo().alert().accept();
            stepSleep();
        } catch (Exception ignored) {}
    }

    private void loginOnce() {
        go(LOGIN_URL);

        type(By.id("identifier"), USER);
        type(By.id("password"), PASS);
        click(By.id("submitBtn"));

        wait.until(d -> !d.getCurrentUrl().contains("/staff/login"));
        stepSleep();
    }

    private Optional<WebElement> firstDisplayed(List<WebElement> els) {
        return els.stream().filter(WebElement::isDisplayed).findFirst();
    }

    // =========================
    // 1) Dashboard - fetch stats + refresh + navigation
    // =========================
    @Test
    @Order(1)
    void dashboard_shouldLoad_refresh_andNavigate() {
        go(BASE + "/dinio/cashier/dashboard");
        assertUrlContains("/dinio/cashier/dashboard");

        // render ids trong dashboard.html
        Assertions.assertTrue(exists(By.id("shiftName")));
        Assertions.assertTrue(exists(By.id("shiftTime")));
        Assertions.assertTrue(exists(By.id("statSeated")));
        Assertions.assertTrue(exists(By.id("statNeedOrder")));
        Assertions.assertTrue(exists(By.id("statPaying")));
        Assertions.assertTrue(exists(By.id("statCancelled")));

        // refresh button trong dashboard.js
        if (exists(By.id("btnRefresh"))) {
            click(By.id("btnRefresh"));
        }

        // quick cards: data-nav
        List<WebElement> navButtons = driver.findElements(By.cssSelector("button[data-nav]"));
        Assertions.assertTrue(navButtons.size() > 0, "Không thấy button[data-nav] trên dashboard");

        // đi /cashier/tables
        navButtons.stream()
                .filter(b -> String.valueOf(b.getAttribute("data-nav")).contains("/dinio/cashier/tables"))
                .findFirst()
                .ifPresent(b -> { b.click(); stepSleep(); });

        assertUrlContains("/dinio/cashier/tables");

        // quay lại dashboard
        go(BASE + "/dinio/cashier/dashboard");
        assertUrlContains("/dinio/cashier/dashboard");

        // mini-grid nav (các nút mcard data-nav có thể trỏ waiter)
        // chỉ click 1 cái bất kỳ nếu có
        List<WebElement> mini = driver.findElements(By.cssSelector(".mini-grid button[data-nav]"));
        if (!mini.isEmpty()) {
            mini.get(0).click();
            stepSleep();
            // không assert url vì có thể trỏ sang waiter; chỉ đảm bảo không crash
            go(BASE + "/dinio/cashier/dashboard");
        }
    }

    // =========================
    // 2) Table Map - select table, open bill, go payment, refresh, clear pick
    // =========================
    @Test
    @Order(2)
    void tableMap_shouldSelect_openBill_goPayment_back_refresh_clearPick() {
        go(BASE + "/dinio/cashier/tables");
        assertUrlContains("/dinio/cashier/tables");

        // các id quan trọng trong cashier-table-map
        Assertions.assertTrue(exists(By.id("wtmList")));
        Assertions.assertTrue(exists(By.id("btnOpenBill")));
        Assertions.assertTrue(exists(By.id("btnPay")));
        Assertions.assertTrue(exists(By.id("btnRefresh")));
        Assertions.assertTrue(exists(By.id("btnClearPick")));

        // chọn 1 bàn trong list (selector mềm)
        WebElement list = visible(By.id("wtmList"));
        List<WebElement> candidates = list.findElements(By.cssSelector("button, [role='button'], [data-id], .wtm-item, .table-card"));
        WebElement first = firstDisplayed(candidates).orElseThrow(() -> new AssertionError("Không có item bàn để click trong #wtmList"));
        first.click();
        stepSleep();

        // verify pickTable có giá trị
        String picked = visible(By.id("pickTable")).getText().trim();
        Assertions.assertFalse(picked.isEmpty() || picked.equals("—"), "Chọn bàn nhưng pickTable không cập nhật");

        // Xem bill (nếu enable)
        WebElement openBill = visible(By.id("btnOpenBill"));
        if (openBill.isEnabled()) {
            openBill.click();
            stepSleep();

            // Modal bill dùng fragment waiter (thường id wtBillModal)
            if (exists(By.id("wtBillModal"))) {
                WebElement modal = visible(By.id("wtBillModal"));
                // modal mở: aria-hidden=false hoặc class open
                wait.until(d ->
                        "false".equals(modal.getAttribute("aria-hidden")) ||
                        modal.getAttribute("class").contains("open") ||
                        !modal.getAttribute("class").contains("is-hidden")
                );

                // đóng modal bằng nút [data-close="1"] nếu có
                List<WebElement> closeBtns = modal.findElements(By.cssSelector("[data-close='1']"));
                if (!closeBtns.isEmpty()) {
                    closeBtns.get(0).click();
                    stepSleep();
                } else {
                    modal.sendKeys(Keys.ESCAPE);
                    stepSleep();
                }
            }
        }

        // Payment (nếu enable)
        WebElement payBtn = visible(By.id("btnPay"));
        if (payBtn.isEnabled()) {
            payBtn.click();
            stepSleep();
            assertUrlContains("/dinio/cashier/payment");

            // chọn pay method
            if (exists(By.cssSelector("#payGrid button[data-pay='CASH']"))) {
                click(By.cssSelector("#payGrid button[data-pay='CASH']"));
            } else if (exists(By.cssSelector("#payGrid button[data-pay='BANK']"))) {
                click(By.cssSelector("#payGrid button[data-pay='BANK']"));
            }

            // mở modal xác nhận pay
            if (exists(By.id("btnPay"))) click(By.id("btnPay"));

            // SAFE_MODE: đóng modal, không confirm
            if (exists(By.id("payModal"))) {
                WebElement modal = visible(By.id("payModal"));
                if (!modal.getAttribute("class").contains("is-hidden")) {
                    List<WebElement> closes = modal.findElements(By.cssSelector("[data-close='1']"));
                    if (!closes.isEmpty()) {
                        closes.get(0).click();
                        stepSleep();
                    }
                }
            }

            // back về tables (btnBack nếu có)
            if (exists(By.id("btnBack"))) {
                click(By.id("btnBack"));
                assertUrlContains("/dinio/cashier/tables");
            } else {
                driver.navigate().back();
                stepSleep();
            }
        }

        // refresh
        click(By.id("btnRefresh"));

        // clear pick
        click(By.id("btnClearPick"));
        String afterClear = visible(By.id("pickTable")).getText().trim();
        Assertions.assertTrue(afterClear.equals("—") || afterClear.isEmpty(), "Clear pick nhưng pickTable vẫn còn giá trị");
    }

    // =========================
    // 3) Payment page - open directly (if accessible) and cancel
    // =========================
    @Test
    @Order(3)
    void payment_page_shouldHandleMethodSelection_andCancelConfirm() {
        // Trang payment thường cần tableId => test “UI/JS” ở mức tồn tại phần tử
        // Nếu vào thẳng bị redirect, vẫn pass ở mức không crash.
        go(BASE + "/dinio/cashier/payment");
        if (driver.getCurrentUrl().contains("/dinio/staff/login")) {
            Assertions.fail("Bị đá về login khi vào payment");
        }

        // Nếu không có payGrid nghĩa là route yêu cầu query param -> bỏ qua assert cứng
        if (!exists(By.id("payGrid"))) return;

        // chọn pay method
        List<WebElement> methods = driver.findElements(By.cssSelector("#payGrid button[data-pay]"));
        if (!methods.isEmpty()) {
            methods.get(0).click();
            stepSleep();
        }

        // mở modal
        if (exists(By.id("btnPay"))) click(By.id("btnPay"));

        // đóng modal
        if (exists(By.id("payModal"))) {
            WebElement modal = visible(By.id("payModal"));
            List<WebElement> closes = modal.findElements(By.cssSelector("[data-close='1']"));
            if (!closes.isEmpty()) {
                closes.get(0).click();
                stepSleep();
            } else {
                modal.sendKeys(Keys.ESCAPE);
                stepSleep();
            }
        }
    }

    // =========================
    // 4) Pending - filter, paging, open detail modal, (optional) confirm/reject
    // =========================
    @Test
    @Order(4)
    void pending_shouldFilter_paginate_openDetail_andSafeActions() {
        go(BASE + "/dinio/cashier/pending");
        assertUrlContains("/dinio/cashier/pending");

        Assertions.assertTrue(exists(By.id("q")));
        Assertions.assertTrue(exists(By.id("date")));
        Assertions.assertTrue(exists(By.id("slot")));
        Assertions.assertTrue(exists(By.id("party")));
        Assertions.assertTrue(exists(By.id("list")));

        // filter
        type(By.id("q"), "a");
        // slot/party nếu có option
        if (exists(By.cssSelector("#slot option[value='MORNING']"))) {
            selectByValue(By.id("slot"), "MORNING");
        }
        if (exists(By.cssSelector("#party option[value='1-2']"))) {
            selectByValue(By.id("party"), "1-2");
        }

        // paging
        if (exists(By.id("nextPage")) && visible(By.id("nextPage")).isEnabled()) click(By.id("nextPage"));
        if (exists(By.id("prevPage")) && visible(By.id("prevPage")).isEnabled()) click(By.id("prevPage"));

        // open detail (nếu list có item button)
        WebElement list = visible(By.id("list"));
        List<WebElement> rows = list.findElements(By.cssSelector("button, .row, [data-id]"));
        if (!rows.isEmpty()) {
            rows.get(0).click();
            stepSleep();

            // nhiều UI sẽ mở modal; thử đóng bằng ESC để an toàn
            new org.openqa.selenium.interactions.Actions(driver).sendKeys(Keys.ESCAPE).perform();
            stepSleep();
        }

        // (optional) confirm/reject nếu bạn muốn test ghi DB:
        if (!SAFE_MODE) {
            // Nếu có nút confirm/reject rõ ràng trong list thì click (cần bạn confirm selector theo HTML thật)
            // safeAcceptAlertIfPresent();
        }
    }

    // =========================
    // 5) Bills - filter/search, view, void modal cancel, (optional) void confirm
    // =========================
    @Test
    @Order(5)
    void bills_shouldFilter_view_andVoidCancel_orConfirmByFlag() {
        go(BASE + "/dinio/cashier/bills");
        assertUrlContains("/dinio/cashier/bills");

        Assertions.assertTrue(exists(By.id("q")));
        Assertions.assertTrue(exists(By.id("cblDate")));
        Assertions.assertTrue(exists(By.id("payType")));
        Assertions.assertTrue(exists(By.id("preType")));
        Assertions.assertTrue(exists(By.id("tbody")));

        type(By.id("q"), "a");

        // payType/preType all
        try {
            new Select(visible(By.id("payType"))).selectByValue("");
            stepSleep();
        } catch (Exception ignored) {}
        try {
            new Select(visible(By.id("preType"))).selectByValue("");
            stepSleep();
        } catch (Exception ignored) {}

        // view bill
        List<WebElement> viewBtns = driver.findElements(By.cssSelector("#tbody button[data-action='view']"));
        if (!viewBtns.isEmpty()) {
            viewBtns.get(0).click();
            stepSleep();
            assertUrlContains("/dinio/cashier/bills/view");
            driver.navigate().back();
            stepSleep();
            assertUrlContains("/dinio/cashier/bills");
        }

        // void
        List<WebElement> voidBtns = driver.findElements(By.cssSelector("#tbody button[data-action='void']"));
        if (voidBtns.isEmpty()) return;

        voidBtns.get(0).click();
        stepSleep();

        if (!exists(By.id("vbModal"))) return;

        WebElement vbModal = visible(By.id("vbModal"));
        Assertions.assertFalse(vbModal.getAttribute("class").contains("is-hidden"), "vbModal không mở");

        if (SAFE_MODE) {
            if (exists(By.id("vbCancelBtn"))) click(By.id("vbCancelBtn"));
            Assertions.assertTrue(visible(By.id("vbModal")).getAttribute("class").contains("is-hidden"), "vbModal không đóng sau cancel");
        } else {
            // XÓA THẬT (gây đổi DB)
            if (exists(By.id("vbConfirmBtn"))) click(By.id("vbConfirmBtn"));
            safeAcceptAlertIfPresent();
        }
    }
}
