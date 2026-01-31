package ut.edu.dinio;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class DinioApplicationTests2 {
    @Test
    void testWaiterOrderFlow() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");

        WebDriver driver = new ChromeDriver(options);

        try {
            driver.get("http://localhost:8080/dinio/staff/login");
            WebDriverWait w = new WebDriverWait(driver, Duration.ofSeconds(10));
            slow(1000);

            w.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='staff']"))).click();
            
            w.until(ExpectedConditions.visibilityOfElementLocated(By.id("identifier"))).sendKeys("waiter1");
            w.until(ExpectedConditions.visibilityOfElementLocated(By.id("password"))).sendKeys("hash_waiter");
            w.until(ExpectedConditions.elementToBeClickable(By.id("submitBtn"))).click();
            
            w.until(ExpectedConditions.not(ExpectedConditions.urlContains("/staff/login")));
            slow(1500);

            driver.get("http://localhost:8080/dinio/waiter/tables");
            slow(2000);

            WebElement tableF206 = w.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//*[contains(text(), 'F2-06')]")
            ));
            
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", tableF206);
            slow(500);
            tableF206.click(); 
            slow(1000);

            WebElement btnStartService = w.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(text(), 'Bắt đầu phục vụ')]")
            ));
            btnStartService.click();

            w.until(ExpectedConditions.urlContains("/waiter/order"));
            slow(2000);

            List<WebElement> addButtons = driver.findElements(By.xpath("//button[contains(text(), 'Thêm')]"));

            if (addButtons.size() < 3) {
                System.out.println("Cảnh báo: Không đủ 3 món để test, sẽ chọn tất cả món hiện có.");
            }

            int itemsToPick = Math.min(addButtons.size(), 3);
            for (int i = 0; i < itemsToPick; i++) {
                WebElement btnAdd = addButtons.get(i);
                
                ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", btnAdd);
                slow(500);
                
                btnAdd.click();
                slow(500); 
            }

            WebElement btnSendKitchen = w.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(text(), 'Gửi bếp')]")
            ));
            
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", btnSendKitchen);
            slow(800);
            
            btnSendKitchen.click();

            w.until(ExpectedConditions.urlContains("/waiter/order-detail"));
            slow(2000);
            
            System.out.println("Đã gửi bếp thành công. Đang ở trang chi tiết: " + driver.getCurrentUrl());

            try {
                WebElement btnBack = driver.findElement(By.xpath("//a[contains(@href, '/waiter/tables')] | //button[contains(text(), 'Quay lại')] | //button[contains(text(), 'Quay về')]"));
                btnBack.click();
            } catch (Exception e) {
                System.out.println("Không thấy nút Back trên UI, thực hiện điều hướng trực tiếp.");
                driver.get("http://localhost:8080/dinio/waiter/tables");
            }

            w.until(ExpectedConditions.urlToBe("http://localhost:8080/dinio/waiter/tables"));
            slow(1000);
            
            System.out.println("Test Complete: Đã quay lại trang Sơ đồ bàn (Waiter Tables).");

        } catch (Exception e) {
            System.out.println("Test Waiter Flow: Thất bại");
            e.printStackTrace();
            throw e;
        } finally {
            driver.quit();
        }
        
    }
    public void slow(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
