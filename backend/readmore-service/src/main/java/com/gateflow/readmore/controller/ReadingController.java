package com.gateflow.readmore.controller;

import com.gateflow.readmore.domain.dto.ReadingRecordRequest;
import com.gateflow.readmore.service.ReadingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reading")
@RequiredArgsConstructor
public class ReadingController {

    private final ReadingService readingService;

    @PostMapping("/record")
    public ResponseEntity<Map<String, Object>> record(@Valid @RequestBody ReadingRecordRequest request) {
        readingService.recordProgress(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Reading progress recorded"));
    }
}
