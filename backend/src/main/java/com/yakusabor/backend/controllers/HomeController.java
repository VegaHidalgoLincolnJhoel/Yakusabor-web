package com.yakusabor.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("message", "YakuSabor API Backend funcionando correctamente en Render");
        status.put("version", "1.0.0");
        return status;
    }
}
