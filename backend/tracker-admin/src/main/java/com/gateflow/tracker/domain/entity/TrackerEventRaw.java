package com.gateflow.tracker.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * SDK 上报的原始事件数据表
 * 存储所有通过 Collector 接口接收的事件
 */
@Data
@TableName("tracker_event_raw")
public class TrackerEventRaw {

    @TableId(type = IdType.AUTO)
    private Long id;

    // 基本信息
    @TableField("event_id")
    private String eventId;

    @TableField("event_type")
    private String eventType;

    @TableField("anonymous_id")
    private String anonymousId;

    @TableField("user_id")
    private String userId;

    // 时间
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

    // 应用标识
    @TableField("app_id")
    private String appId;

    @TableField("platform")
    private String platform;

    @TableField("sdk_version")
    private String sdkVersion;

    // 时间戳
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}