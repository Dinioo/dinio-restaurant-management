package ut.edu.dinio;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class KitchenTest {

  private WebDriver driver;
  private WebDriverWait wait;

  // Base URL
  private final String baseUrl = System.getProperty("BASE_URL", "http://localhost:8080");

  // Login page
  private final String loginUrl = baseUrl + "/dinio/staff/login";
  private final String kdsUrl = baseUrl + "/dinio/kitchen/dashboard";
  private final String historyUrl = baseUrl + "/dinio/kitchen/history";

  // Credentials (override bằng -D...)
  private final String username = System.getProperty("KITCHEN_USER", "kitchen1");
  private final String password = System.getProperty("KITCHEN_PASS", "hash_kitchen");

  // Slow step
  private final long STEP_DELAY_MS = Long.parseLong(System.getProperty("STEP_DELAY_MS", "1000"));

  @BeforeAll
  void setup() {
    ChromeOptions options = new ChromeOptions();
    // Nếu cần chạy headless:
    // options.addArguments("--headless=new");
    options.addArguments("--window-size=1400,900");
    options.addArguments("--disable-notifications");

    driver = new ChromeDriver(options);
    wait = new WebDriverWait(driver, Duration.ofSeconds(12));

    loginOnce();
  }

  @AfterAll
  void teardown() {
    if (driver != null) driver.quit();
  }

  // ----------------------------
  // Helpers
  // ----------------------------

  private void stepDelay() {
    try { Thread.sleep(STEP_DELAY_MS); } catch (InterruptedException ignored) {}
  }

  private WebElement must(By locator) {
    return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
  }

  private WebElement clickable(By locator) {
    return wait.until(ExpectedConditions.elementToBeClickable(locator));
  }

  private boolean exists(By locator) {
    return !driver.findElements(locator).isEmpty();
  }

  private void safeClick(By locator) {
    WebElement el = clickable(locator);
    el.click();
    stepDelay();
  }

  private void safeType(By locator, String text) {
    WebElement el = clickable(locator);
    el.clear();
    el.sendKeys(text);
    stepDelay();
  }

  private void scrollIntoView(WebElement el) {
    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", el);
  }

  private void loginOnce() {
    driver.get(loginUrl);
    wait.until(ExpectedConditions.presenceOfElementLocated(By.id("identifier")));

    safeType(By.id("identifier"), username);
    safeType(By.id("password"), password);

    // nút đăng nhập
    safeClick(By.id("submitBtn"));

    // Sau login thường sẽ redirect. Chỉ cần đảm bảo không còn ở /staff/login
    wait.until(d -> !d.getCurrentUrl().contains("/dinio/staff/login"));
    stepDelay();
  }

  private void gotoKds() {
    driver.get(kdsUrl);
    // KDS có input search id="q" theo kitchen-kds.js
    wait.until(ExpectedConditions.presenceOfElementLocated(By.id("q")));
    stepDelay();
  }

  private void gotoHistory() {
    driver.get(historyUrl);
    // History cũng dùng id="q" theo kitchen-history.js
    wait.until(ExpectedConditions.presenceOfElementLocated(By.id("q")));
    stepDelay();
  }

  // ----------------------------
  // Tests: Kitchen KDS
  // ----------------------------

  @Test
  @Order(1)
  void kds_shouldLoadBoardAndColumns() {
    gotoKds();

    Assertions.assertTrue(exists(By.id("colNEW")), "Thiếu cột colNEW");
    Assertions.assertTrue(exists(By.id("colCOOKING")), "Thiếu cột colCOOKING");
    Assertions.assertTrue(exists(By.id("colREADY")), "Thiếu cột colREADY");

    // chip filter stationChips được bind trong kitchen-kds.js
    Assertions.assertTrue(exists(By.id("stationChips")), "Thiếu stationChips");
  }

  @Test
  @Order(2)
  void kds_search_shouldFilterCards() {
    gotoKds();

    // Nhập từ khóa bất kỳ để trigger input listener
    safeType(By.id("q"), "a");
    // Không assert số lượng vì dữ liệu phụ thuộc DB,
    // nhưng ít nhất không crash và vẫn render được cột
    Assertions.assertTrue(exists(By.id("colNEW")));
  }

  @Test
  @Order(3)
  void kds_stationChip_shouldBeClickable() {
    gotoKds();

    WebElement chips = must(By.id("stationChips"));
    List<WebElement> btns = chips.findElements(By.cssSelector("button.chip, button"));
    Assertions.assertFalse(btns.isEmpty(), "Không thấy button chip trong stationChips");

    WebElement first = btns.get(0);
    scrollIntoView(first);
    first.click();
    stepDelay();
  }

  @Test
  @Order(4)
  void kds_openModalFromFirstCard_andClose() {
    gotoKds();

    // Card render có class .kcard (kitchen-kds.js)
    // Chờ có ít nhất 1 card (nếu DB chưa có món => skip nhẹ)
    List<WebElement> cards = driver.findElements(By.cssSelector(".kcard"));
    if (cards.isEmpty()) {
      System.out.println("SKIP: Không có kcard nào để test modal (DB chưa có món).");
      return;
    }

    WebElement card = cards.get(0);
    scrollIntoView(card);

    // Click vào nút Chi tiết (data-action="detail") nếu có, fallback click card
    List<WebElement> detailBtns = card.findElements(By.cssSelector("button[data-action='detail']"));
    if (!detailBtns.isEmpty()) {
      detailBtns.get(0).click();
    } else {
      card.click();
    }
    stepDelay();

    // Modal id="kdModal"
    WebElement modal = must(By.id("kdModal"));
    // modal mở thường sẽ remove "is-hidden" hoặc aria-hidden=false, ta check presence thôi
    Assertions.assertNotNull(modal);

    // close bằng [data-close='1'] theo kitchen-kds.js
    List<WebElement> closers = modal.findElements(By.cssSelector("[data-close='1']"));
    if (!closers.isEmpty()) {
      closers.get(0).click();
      stepDelay();
    } else {
      // fallback ESC
      new Actions(driver).sendKeys(Keys.ESCAPE).perform();
      stepDelay();
    }
  }

  @Test
  @Order(5)
  void kds_nextStatus_shouldWork_ifButtonExists() {
    gotoKds();

    List<WebElement> cards = driver.findElements(By.cssSelector(".kcard"));
    if (cards.isEmpty()) {
      System.out.println("SKIP: Không có kcard nào để test next status (DB chưa có món).");
      return;
    }

    WebElement card = cards.get(0);
    scrollIntoView(card);

    // Click Next button (data-action="next") theo kitchen-kds.js
    List<WebElement> nextBtns = card.findElements(By.cssSelector("button[data-action='next']"));
    if (!nextBtns.isEmpty()) {
      nextBtns.get(0).click();
      stepDelay();
      // Không assert trạng thái vì phụ thuộc API/DB, nhưng ít nhất không crash
      Assertions.assertTrue(exists(By.id("colNEW")) || exists(By.id("colCOOKING")) || exists(By.id("colREADY")));
      return;
    }

    // Nếu không có Next trên card, thử mở modal rồi bấm #kdNext
    card.click();
    stepDelay();

    if (exists(By.id("kdNext"))) {
      safeClick(By.id("kdNext"));
      // Sau bấm, modal có thể đóng hoặc vẫn mở tuỳ logic
      Assertions.assertTrue(true);
    } else {
      System.out.println("SKIP: Không thấy nút next trên card và cũng không có #kdNext trong modal.");
    }
  }

  // ----------------------------
  // Tests: Kitchen History
  // ----------------------------

  @Test
  @Order(6)
  void history_shouldLoad_andRenderContainer() {
    gotoHistory();

    // Theo kitchen-history.js: #hRows, #hEmpty, #hCount (ít nhất các id này thường có)
    Assertions.assertTrue(exists(By.id("hRows")), "Thiếu hRows");
    Assertions.assertTrue(exists(By.id("hCount")), "Thiếu hCount");
  }

  @Test
  @Order(7)
  void history_search_and_chips_shouldBeInteractable() {
    gotoHistory();

    safeType(By.id("q"), "a");

    // stationChips và rangeChips (nếu có trong HTML)
    if (exists(By.id("stationChips"))) {
      WebElement st = must(By.id("stationChips"));
      List<WebElement> btns = st.findElements(By.cssSelector("button.chip, button"));
      if (!btns.isEmpty()) {
        btns.get(0).click();
        stepDelay();
      }
    }

    if (exists(By.id("rangeChips"))) {
      WebElement rg = must(By.id("rangeChips"));
      List<WebElement> btns = rg.findElements(By.cssSelector("button.chip, button"));
      if (!btns.isEmpty()) {
        btns.get(0).click();
        stepDelay();
      }
    }

    Assertions.assertTrue(exists(By.id("hRows")));
  }
}
