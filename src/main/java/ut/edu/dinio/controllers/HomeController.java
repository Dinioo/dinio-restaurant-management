package ut.edu.dinio.controllers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;
import ut.edu.dinio.pojo.Customer;
import ut.edu.dinio.pojo.MenuItem;
import ut.edu.dinio.pojo.Reservation;
import ut.edu.dinio.service.MenuItemService;
import ut.edu.dinio.service.ReservationService;

@Controller
public class HomeController {

  @Autowired
  private ReservationService reservationService;

  @Autowired
  private MenuItemService menuItemService;

  @GetMapping("/")
  public String home() {
    return "customer/home";
  }

  @GetMapping("/api/menu/favorites")
  @ResponseBody
  public ResponseEntity<List<Map<String, Object>>> getFavoriteItemsApi() {
    List<MenuItem> favorites = menuItemService.getFavoriteItems();
    List<Map<String, Object>> response = favorites.stream().map(item -> {
      Map<String, Object> map = new HashMap<>();
      map.put("id", item.getId());
      map.put("name", item.getName());
      map.put("description", item.getDescription());
      map.put("price", String.format("%,.0fđ", item.getBasePrice()));
      map.put("imageUrl", item.getImageUrl());

      String tag = "Signature";
      if (item.getItemTags() != null && !item.getItemTags().isEmpty()) {
        tag = item.getItemTags().iterator().next().name();
      }
      map.put("tag", tag);
      return map;
    }).collect(Collectors.toList());

    return ResponseEntity.ok(response);
  }

  @GetMapping("/api/menu/items/{id}")
  @ResponseBody
  public ResponseEntity<?> getMenuItemDetail(@PathVariable Integer id) {
    MenuItem item = menuItemService.getItemById(id);
    if (item == null)
      return ResponseEntity.notFound().build();

    Map<String, Object> map = new HashMap<>();
    map.put("id", item.getId());
    map.put("name", item.getName());
    map.put("description", item.getDescription());
    map.put("ingredients", item.getIngredients());
    map.put("calories", item.getCalories());
    map.put("price", item.getBasePrice());
    map.put("imageUrl", item.getImageUrl());
    map.put("spiceLevel", item.getSpiceLevel());
    map.put("tags", item.getItemTags());
    map.put("allergens", item.getAllergyTags());

    return ResponseEntity.ok(map);
  }

  @GetMapping("/reservations/my")
  public String myReservationsPage(HttpSession session) {
    if (session.getAttribute("currentUser") == null)
      return "redirect:/login";
    return "customer/reservations-my";
  }

  @GetMapping("/api/reservations/my")
  @ResponseBody
  public ResponseEntity<?> getMyReservationsApi(HttpSession session) {
    Customer user = (Customer) session.getAttribute("currentUser");
    if (user == null)
      return ResponseEntity.status(401).build();

    List<Reservation> list = reservationService.getReservationsByCustomer(user.getId());
    List<Map<String, Object>> response = new ArrayList<>();
    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd • HH:mm");
    LocalDateTime now = LocalDateTime.now();

    for (Reservation res : list) {
      Map<String, Object> item = new HashMap<>();
      item.put("id", res.getId());
      item.put("code", "RSV-" + res.getId());
      item.put("status", res.getStatus().name());
      item.put("table", res.getTable() != null ? res.getTable().getCode() : "—");
      item.put("area", res.getArea() != null ? res.getArea().getName() : "Chưa xếp");

      String areaName = res.getArea() != null ? res.getArea().getName() : "";
      String areaKey = "all";
      if (areaName.contains("1"))
        areaKey = "Tầng 1";
      else if (areaName.contains("2"))
        areaKey = "Tầng 2";
      else if (areaName.contains("3"))
        areaKey = "Tầng 3";
      else if (areaName.equalsIgnoreCase("VIP"))
        areaKey = "VIP";
      else if (areaName.equalsIgnoreCase("Outdoor"))
        areaKey = "Outdoor";
      item.put("areaKey", areaKey);

      item.put("party", res.getPartySize());
      item.put("displayTime", res.getReservedAt().format(fmt));
      item.put("datetime", res.getReservedAt().toString());
      item.put("note", res.getNote());

      boolean isPast = res.getReservedAt().isBefore(now);
      item.put("bucket", isPast ? "past" : "upcoming");

      response.add(item);
    }
    return ResponseEntity.ok(response);
  }

  @PostMapping("/api/reservations/cancel")
  @ResponseBody
  public ResponseEntity<?> cancelApi(@RequestBody Map<String, Integer> body, HttpSession session) {
    Customer user = (Customer) session.getAttribute("currentUser");
    if (user == null)
      return ResponseEntity.status(401).build();
    String result = reservationService.cancelReservation(body.get("id"), user);
    return "success".equals(result) ? ResponseEntity.ok("OK") : ResponseEntity.badRequest().body(result);
  }

}
