-- V3__create_tracker_event_raw.sql
-- 创建 SDK 事件原始数据表

CREATE TABLE IF NOT EXISTS tracker_event_raw (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 基本信息
    event_id VARCHAR(64) COMMENT '事件唯一ID',
    event_type VARCHAR(32) NOT NULL COMMENT '事件类型: page_view/click/exposure/scroll/stay',
    anonymous_id VARCHAR(64) COMMENT '匿名用户ID',
    user_id VARCHAR(64) COMMENT '用户ID',

    -- 时间
    timestamp BIGINT NOT NULL COMMENT '事件时间戳(ms)',
    client_time BIGINT COMMENT '客户端时间(ms)',

    -- 应用信息
    app_id VARCHAR(64) COMMENT '应用ID',
    platform VARCHAR(32) COMMENT '平台: web/ios/android',
    sdk_version VARCHAR(32) COMMENT 'SDK版本',

    -- 页面信息
    page_url VARCHAR(512) COMMENT '页面URL',
    page_title VARCHAR(256) COMMENT '页面标题',
    page_referrer VARCHAR(512) COMMENT '来源页面',

    -- 会话信息
    session_id VARCHAR(64) COMMENT '会话ID',
    session_start_time BIGINT COMMENT '会话开始时间(ms)',

    -- 设备信息
    screen_width INT COMMENT '屏幕宽度',
    screen_height INT COMMENT '屏幕高度',
    user_agent VARCHAR(512) COMMENT '浏览器UA',
    language VARCHAR(16) COMMENT '浏览器语言',

    -- SPM 信息
    spm_code VARCHAR(32) COMMENT 'SPM点位编码',
    spm_level INT COMMENT 'SPM层级: 0=SPMA, 1=SPMB, 2=SPMC, 3=SPMD',
    element_id VARCHAR(128) COMMENT '元素ID',
    element_type VARCHAR(32) COMMENT '元素类型: button/div/a等',
    element_text VARCHAR(256) COMMENT '元素文本(截取100字符)',

    -- 事件数据
    click_x INT COMMENT '点击X坐标(相对元素)',
    click_y INT COMMENT '点击Y坐标(相对元素)',
    exposure_ratio DOUBLE COMMENT '曝光比例(0-1)',
    exposure_duration INT COMMENT '曝光时长(ms)',

    -- UTM 参数
    utm_source VARCHAR(128) COMMENT 'UTM来源',
    utm_medium VARCHAR(128) COMMENT 'UTM媒介',
    utm_campaign VARCHAR(128) COMMENT 'UTM活动',
    utm_term VARCHAR(128) COMMENT 'UTM关键词',
    utm_content VARCHAR(256) COMMENT 'UTM内容',

    -- 原始数据
    raw_data TEXT COMMENT '原始JSON数据',

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_event_type (event_type),
    INDEX idx_spm_code (spm_code),
    INDEX idx_timestamp (timestamp),
    INDEX idx_session_id (session_id),
    INDEX idx_anonymous_id (anonymous_id),
    INDEX idx_app_id (app_id),
    INDEX idx_page_url (page_url(100)),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SDK事件原始数据表';