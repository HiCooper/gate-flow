package com.gateflow.readmore.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_reading_record")
public class UserReadingRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String userId;
    private Long bookId;
    private Long chapterId;
    private Integer readProgress;
    private LocalDateTime lastReadAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
