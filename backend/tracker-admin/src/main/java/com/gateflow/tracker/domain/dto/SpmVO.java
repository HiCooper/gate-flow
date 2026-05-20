package com.gateflow.tracker.domain.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SpmVO {
    private Long id;
    private String spmCode;
    private String spmName;
    private String description;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 层级结构字段
    private Integer level;           // 0=应用(SPMA) 1=页面(SPMB) 2=区块(SPMC) 3=点位(SPMD)
    private Long parentId;           // 父级SPM ID
    private String path;             // 完整路径: app_page_block_spot
    private Integer sortOrder;       // 同级排序

    // 面包屑展示用
    private String parentName;       // 父级名称

    // 子节点（树形结构用）
    private List<SpmVO> children;
}