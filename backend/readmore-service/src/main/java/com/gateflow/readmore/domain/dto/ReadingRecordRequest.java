package com.gateflow.readmore.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReadingRecordRequest {
    @NotBlank
    private String userId;
    @NotNull
    private Long bookId;
    @NotNull
    private Long chapterId;
    private Integer readProgress;
}
