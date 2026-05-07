package com.gateflow.readmore.controller;

import com.gateflow.readmore.domain.dto.UserInitResponse;
import com.gateflow.readmore.domain.dto.UserProfileResponse;
import com.gateflow.readmore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/init")
    public UserInitResponse initUser(@RequestParam(required = false) String userId) {
        if (userId == null || userId.isEmpty()) {
            userId = "user_" + UUID.randomUUID().toString().substring(0, 8);
        }
        return userService.initUser(userId);
    }

    @GetMapping("/{userId}/profile")
    public UserProfileResponse getProfile(@PathVariable String userId) {
        return userService.getProfile(userId);
    }
}
