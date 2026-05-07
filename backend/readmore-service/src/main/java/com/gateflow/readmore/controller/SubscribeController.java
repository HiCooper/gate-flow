package com.gateflow.readmore.controller;

import com.gateflow.readmore.domain.dto.SubscribeRequest;
import com.gateflow.readmore.domain.entity.Subscription;
import com.gateflow.readmore.mapper.SubscriptionMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/subscribe")
@RequiredArgsConstructor
public class SubscribeController {

    private final SubscriptionMapper subscriptionMapper;

    @PostMapping
    public ResponseEntity<Map<String, Object>> subscribe(@Valid @RequestBody SubscribeRequest request) {
        Subscription subscription = new Subscription();
        subscription.setUserId(request.getUserId());
        subscription.setPlanType(request.getPlanType());
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(LocalDateTime.now().plusMonths(1));
        subscription.setStatus("active");
        subscriptionMapper.insert(subscription);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Subscription created",
                "subscriptionId", subscription.getId()
        ));
    }
}
