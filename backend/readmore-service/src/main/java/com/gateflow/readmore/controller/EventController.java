package com.gateflow.readmore.controller;

import com.gateflow.readmore.config.VictorSdkConfig;
import com.gateflow.readmore.domain.dto.EventReportRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final VictorSdkConfig victorConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/report")
    public ResponseEntity<Map<String, Object>> reportEvent(@Valid @RequestBody EventReportRequest request) {
        try {
            Map<String, Object> eventPayload = new HashMap<>();
            List<Map<String, Object>> events = new ArrayList<>();
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", request.getEventType());
            event.put("userId", request.getUserId());
            event.put("timestamp", request.getTimestamp());
            event.put("platform", request.getPlatform() != null ? request.getPlatform() : "readmore-h5");
            event.put("deviceId", request.getDeviceId());
            event.put("sessionId", request.getSessionId());

            if (request.getExperimentTags() != null && !request.getExperimentTags().isEmpty()) {
                event.put("experimentTags", request.getExperimentTags());
            }
            if (request.getProperties() != null && !request.getProperties().isEmpty()) {
                event.put("properties", request.getProperties());
            }

            events.add(event);
            eventPayload.put("events", events);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> httpEntity = new HttpEntity<>(objectMapper.writeValueAsString(eventPayload), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    victorConfig.getGateflowEventUrl(),
                    HttpMethod.POST,
                    httpEntity,
                    String.class
            );

            return ResponseEntity.status(response.getStatusCode()).body(Map.of(
                    "success", true,
                    "message", "Event forwarded to GateFlow",
                    "status", response.getStatusCodeValue()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to forward event: " + e.getMessage()
            ));
        }
    }
}
