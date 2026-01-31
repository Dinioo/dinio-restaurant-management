package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CustomerController {

    @GetMapping("/customer/notifications")
    public String notifications() {
        return "customer/notifications";
    }

    @GetMapping("/help")
    public String helpPage() {
        return "customer/help";
    }
}
