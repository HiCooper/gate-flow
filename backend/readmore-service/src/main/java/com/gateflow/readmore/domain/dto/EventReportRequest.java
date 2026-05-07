package com.gateflow.readmore.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class EventReportRequest {
    @NotBlank
    private String eventType;
    @NotBlank
    private String userId;
    @NotNull
    private Long timestamp;
    private String platform;
    private String deviceId;
    private String sessionId;
    private List<ExperimentTagDto> experimentTags;
    private Map<String, Object> properties;

    @Data
    public static class ExperimentTagDto {
        private String expId;
        private String variant;
        private String layer;
    }
}
