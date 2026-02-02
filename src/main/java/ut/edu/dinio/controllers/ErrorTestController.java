package ut.edu.dinio.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ErrorTestController {

    @GetMapping("/test/page/401")
    public String page401() {
        return "error/401";
    }

    @GetMapping("/test/page/403")
    public String page403() {
        return "error/403";
    }

    @GetMapping("/test/page/404")
    public String page404() {
        return "error/404";
    }

    @GetMapping("/test/page/500")
    public String page500() {
        return "error/500";
    }

    @GetMapping("/test/page/505")
    public String page505() {
        return "error/505";
    }
}
