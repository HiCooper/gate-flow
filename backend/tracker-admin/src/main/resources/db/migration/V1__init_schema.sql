-- Tracker Admin 数据库结构（仅元数据管理）

SET FOREIGN_KEY_CHECKS = 0;

-- 事件定义表
CREATE TABLE tracker_event (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_key   VARCHAR(64) NOT NULL UNIQUE COMMENT '事件标识',
    event_name  VARCHAR(128) NOT NULL COMMENT '事件名称',
    description VARCHAR(512),
    category    VARCHAR(32) DEFAULT 'custom' COMMENT '事件分类: page_view/click/exposure/custom',
    status      TINYINT DEFAULT 1 COMMENT '状态: 0禁用 1启用',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除: 0未删除 1已删除',
    INDEX idx_event_key (event_key),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事件定义表';

-- 属性定义表
CREATE TABLE tracker_property (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id    BIGINT NOT NULL COMMENT '关联事件ID',
    prop_key    VARCHAR(64) NOT NULL COMMENT '属性标识',
    prop_name   VARCHAR(128) NOT NULL COMMENT '属性名称',
    data_type   VARCHAR(32) DEFAULT 'string' COMMENT '类型: string/number/boolean/date',
    description VARCHAR(512),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除',
    FOREIGN KEY (event_id) REFERENCES tracker_event(id) ON DELETE CASCADE,
    UNIQUE KEY uk_event_prop (event_id, prop_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='属性定义表';

-- SPM 配置表 (含层级结构)
CREATE TABLE tracker_spm (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    spm_code    VARCHAR(64) NOT NULL COMMENT 'SPM编码',
    spm_name    VARCHAR(128) NOT NULL COMMENT 'SPM名称',
    spma_label  VARCHAR(64) COMMENT 'A层标签',
    spmb_label  VARCHAR(64) COMMENT 'B层标签',
    spmc_label  VARCHAR(64) COMMENT 'C层标签',
    spmd_label  VARCHAR(64) COMMENT 'D层标签',
    level       TINYINT DEFAULT 0 COMMENT '层级深度: 0=应用(SPMA) 1=页面(SPMB) 2=区块(SPMC) 3=点位(SPMD)',
    parent_id   BIGINT COMMENT '父级SPM ID，NULL表示根节点(SPMA)',
    path        VARCHAR(512) COMMENT '完整路径: app_page_block_spot',
    sort_order  INT DEFAULT 0 COMMENT '同级排序',
    description VARCHAR(512),
    status      TINYINT DEFAULT 1 COMMENT '状态: 0禁用 1启用',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除',
    -- 虚拟生成列：仅根节点(level=0)参与唯一索引，MySQL 允许多个 NULL 不冲突
    spma_code_for_unique VARCHAR(64)
        GENERATED ALWAYS AS (CASE WHEN level = 0 THEN spm_code ELSE NULL END) VIRTUAL
        COMMENT '辅助列：仅根节点(level=0)参与唯一索引',
    INDEX idx_spm_code (spm_code),
    INDEX idx_status (status),
    UNIQUE INDEX uk_spma_code (spma_code_for_unique),
    INDEX idx_spm_parent (parent_id),
    INDEX idx_spm_level (level),
    CONSTRAINT fk_spm_parent FOREIGN KEY (parent_id) REFERENCES tracker_spm(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SPM配置表';

-- 看板配置表
CREATE TABLE tracker_dashboard (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(128) NOT NULL COMMENT '看板名称',
    config      JSON NOT NULL COMMENT '看板配置JSON',
    created_by  VARCHAR(64),
    status      TINYINT DEFAULT 1 COMMENT '状态: 0禁用 1启用',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_status (status),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='看板配置表';
SET FOREIGN_KEY_CHECKS = 1;
