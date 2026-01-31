package ut.edu.dinio;

import java.time.Duration;
import java.util.List; // Import thêm List để dùng cho danh sách món ăn

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DinioApplicationTests {

    @Test
    void openAdminStaffPage() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");

        WebDriver driver = new ChromeDriver(options);

        try {
            String url = "http://localhost:8080/dinio/";
            driver.get(url);
            slow(3000);

            driver.get("http://localhost:8080/dinio/login");

            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
            slow(800);

            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("identifier")))
                    .sendKeys("tienminh@gmail.com");
            slow(800);

            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("password")))
                    .sendKeys("hash_customer_4");
            slow(800);

            wait.until(ExpectedConditions.elementToBeClickable(By.id("submitBtn"))).click();
            slow(1200);

            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollTo(0, document.body.scrollHeight)");
            slow(3000);
            js.executeScript("window.scrollTo(0, 0)");
            slow(3000);

            driver.get("http://localhost:8080/dinio/reservations/my");
            slow(1500);

            driver.get("http://localhost:8080/dinio/reservation/tables");

            WebDriverWait w = new WebDriverWait(driver, Duration.ofSeconds(20));

            WebElement resDate = w.until(ExpectedConditions.visibilityOfElementLocated(By.id("resDate")));
            WebElement resTime = w.until(ExpectedConditions.visibilityOfElementLocated(By.id("resTime")));
            WebElement resGuests = w.until(ExpectedConditions.visibilityOfElementLocated(By.id("resGuests")));

            
            typeDateMDY(driver, resDate, "01", "31", "2026");
            slow(600);

            typeTimeHHMM(driver, resTime, "17", "30");
            slow(800);

            w.until(ExpectedConditions.textToBePresentInElementLocated(By.id("pickTime"), "2026"));
            w.until(ExpectedConditions.textToBePresentInElementLocated(By.id("pickTime"), "17:30"));

            setValue(resGuests, "4");
            slow(1000);

            By tableF205 = By.cssSelector("button.tm-table[data-code='F2-05']");

            WebElement tableBtn = w.until(ExpectedConditions.presenceOfElementLocated(tableF205));
            ((JavascriptExecutor) driver).executeScript(
                    "arguments[0].scrollIntoView({block:'center'});", tableBtn);
            slow(1000);
            

            if (!tableBtn.isEnabled()) {
                throw new IllegalStateException("Bàn F2-05 đang bị disabled (bận hoặc không đủ điều kiện).");
            }

            w.until(ExpectedConditions.elementToBeClickable(tableF205)).click();
            slow(800);

            By noteBy = By.id("note");
            WebElement note = w.until(ExpectedConditions.visibilityOfElementLocated(noteBy));
            setValue(note, "Ghét ăn hành");
            slow(1000);

            By submitReserve = By.id("btnSubmitReserve");
            WebElement btn = w.until(ExpectedConditions.elementToBeClickable(submitReserve));

            if (!btn.isEnabled()) {
                throw new IllegalStateException("Nút Đặt bàn đang bị disabled. Kiểm tra đã chọn bàn + date + time chưa.");
            }

            btn.click();
            slow(1500);

            WebElement btnYes = w.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(text(), 'Có')]") 
            ));
            btnYes.click();
            slow(2000);

            w.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".po-card")));
            
            List<WebElement> addButtons = driver.findElements(By.cssSelector(".po-card .btn-add"));
            
            int itemsToPick = 3;
            if (addButtons.size() < itemsToPick) itemsToPick = addButtons.size(); // Phòng trường hợp menu ít hơn 3 món

            for (int i = 0; i < itemsToPick; i++) {
                WebElement addBtn = addButtons.get(i);
                
                ((JavascriptExecutor) driver).executeScript(
                    "arguments[0].scrollIntoView({block:'center'});", addBtn);
                slow(500); 
                
                addBtn.click();
                slow(500);
            }
            slow(1000);

            WebElement btnCheckout = w.until(ExpectedConditions.elementToBeClickable(By.id("btnGoCheckout")));
            
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", btnCheckout);
            slow(500);
            
            btnCheckout.click();
            slow(2000); 

            WebElement btnBack = w.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("a.icon-btn[href*='/reservations/my']")
            ));
            
            btnBack.click();
            slow(2000);

            if (driver.getCurrentUrl().contains("reservations/my")) {
                System.out.println("Test Complete: Đã quay lại trang Lịch đặt bàn thành công.");
            } else {
                System.out.println("Warning: Có thể chưa quay lại đúng trang.");
            }

        } finally {
            driver.quit();
        }
    }

    private void setValue(WebElement el, String value) {
        el.click();
        el.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        el.sendKeys(Keys.BACK_SPACE);
        el.sendKeys(value);
    }

    private void typeDateMDY(WebDriver driver, WebElement dateInput, String mm, String dd, String yyyy) {
    dateInput.click();
    dateInput.sendKeys(Keys.chord(Keys.CONTROL, "a"));
    dateInput.sendKeys(Keys.BACK_SPACE);

    // Gõ từng phần: MM / DD / YYYY (bạn có thể đổi "/" thành "-" nếu UI yêu cầu)
    dateInput.sendKeys(mm); slow(350);
    dateInput.sendKeys("/"); slow(200);
    dateInput.sendKeys(dd); slow(350);
    dateInput.sendKeys("/"); slow(200);
    dateInput.sendKeys(yyyy); slow(450);

    // Bắn event để JS của bạn cập nhật pickTime & enable nút
    ((JavascriptExecutor) driver).executeScript(
        "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));" +
        "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));",
        dateInput
    );

    // Nếu input type=date không nhận kiểu gõ này => fallback ISO
    String val = dateInput.getAttribute("value");
    if (val == null || val.isBlank()) {
        String iso = yyyy + "-" + mm + "-" + dd; // 2026-01-31
        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].value = arguments[1];" +
            "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));" +
            "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));",
            dateInput, iso
        );
    }
}

    private void typeTimeHHMM(WebDriver driver, WebElement timeInput, String hh, String mm) {
        timeInput.click();
        timeInput.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        timeInput.sendKeys(Keys.BACK_SPACE);

        timeInput.sendKeys(hh); slow(350);
        timeInput.sendKeys(":"); slow(200);
        timeInput.sendKeys(mm); slow(350);

        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));" +
            "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));",
            timeInput
        );
    }


    public void slow(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}