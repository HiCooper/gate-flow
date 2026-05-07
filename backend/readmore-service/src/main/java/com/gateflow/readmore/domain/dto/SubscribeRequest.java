package com.gateflow.readmore.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubscribeRequest {
    @NotBlank
    private String userId;
    @NotBlank
    private String planType;
}
