package com.gateflow.readmore.domain.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UserProfileResponse {
    private String userId;
    private List<UserReadingRecordDto> readingHistory;
    private SubscriptionDto subscription;
    private Map<String, String> variants;

    @Data
    public static class UserReadingRecordDto {
        private Long bookId;
        private String bookTitle;
        private Long chapterId;
        private Integer readProgress;
        private String lastReadAt;
    }

    @Data
    public static class SubscriptionDto {
        private String planType;
        private String startDate;
        private String endDate;
        private String status;
    }
}
