package com.gateflow.tracker.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("tracker_event")
public class TrackerEvent {

    @TableId(type = IdType.AUTO)
    private Long id;

    // 事件定义字段
    @TableField("event_key")
    private String eventKey;

    @TableField("event_name")
    private String eventName;

    @TableField("description")
    private String description;

    @TableField("category")
    private String category;

    @TableField("status")
    private Integer status;

    // SDK 上报数据
    @TableField("event_id")
    private String eventId;

    @TableField("anonymous_id")
    private String anonymousId;

    @TableField("timestamp")
    private Long timestamp;

    @TableField("client_time")
    private Long clientTime;

    // 页面信息
    @TableField("page_url")
    private String pageUrl;

    @TableField("page_title")
    private String pageTitle;

    @TableField("page_referrer")
    private String pageReferrer;

    // 会话信息
    @TableField("session_id")
    private String sessionId;

    @TableField("session_start_time")
    private Long sessionStartTime;

    // 设备信息
    @TableField("screen_width")
    private Integer screenWidth;

    @TableField("screen_height")
    private Integer screenHeight;

    @TableField("user_agent")
    private String userAgent;

    @TableField("language")
    private String language;

    // SPM 信息
    @TableField("spm_code")
    private String spmCode;

    @TableField("spm_level")
    private Integer spmLevel;

    @TableField("element_id")
    private String elementId;

    @TableField("element_type")
    private String elementType;

    @TableField("element_text")
    private String elementText;

    // 事件数据
    @TableField("click_x")
    private Integer clickX;

    @TableField("click_y")
    private Integer clickY;

    @TableField("exposure_ratio")
    private Double exposureRatio;

    @TableField("exposure_duration")
    private Integer exposureDuration;

    // UTM 参数
    @TableField("utm_source")
    private String utmSource;

    @TableField("utm_medium")
    private String utmMedium;

    @TableField("utm_campaign")
    private String utmCampaign;

    @TableField("utm_term")
    private String utmTerm;

    @TableField("utm_content")
    private String utmContent;

    // 原始数据
    @TableField("raw_data")
    private String rawData;

    @TableField("app_id")
    private String appId;

    // 时间戳
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}