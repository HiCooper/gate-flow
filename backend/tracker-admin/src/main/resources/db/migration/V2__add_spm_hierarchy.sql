-- V2: SPM 层级结构改造
-- 新增 level, parent_id, path, sort_order 字段支持层级关系

ALTER TABLE tracker_spm ADD COLUMN (
    level       TINYINT DEFAULT 0 COMMENT '层级深度: 0=应用(SPMA) 1=页面(SPMB) 2=区块(SPMC) 3=点位(SPMD)',
    parent_id   BIGINT COMMENT '父级SPM ID，NULL表示根节点(SPMA)',
    path        VARCHAR(512) COMMENT '完整路径: app_page_block_spot',
    sort_order  INT DEFAULT 0 COMMENT '同级排序'
);

-- 添加外键约束
ALTER TABLE tracker_spm ADD CONSTRAINT fk_spm_parent
    FOREIGN KEY (parent_id) REFERENCES tracker_spm(id) ON DELETE SET NULL;

-- 创建唯一索引：同一父级下 spm_code 不能重复
-- 注意：parent_id 为 NULL 时表示根节点，需要特殊处理
CREATE UNIQUE INDEX uk_spma_code ON tracker_spm(level, spm_code) WHERE level = 0;

-- 创建索引提升查询性能
CREATE INDEX idx_spm_parent ON tracker_spm(parent_id);
CREATE INDEX idx_spm_level ON tracker_spm(level);