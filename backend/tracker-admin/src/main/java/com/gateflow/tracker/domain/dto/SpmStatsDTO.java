package com.gateflow.tracker.domain.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * SPM 统计指标
 */
@Data
public class SpmStatsDTO {

    /**
     * SPM 编码
     */
    private String spmCode;

    /**
     * SPM 名称
     */
    private String spmName;

    /**
     * 层级 (3=区块, 4=点位)
     */
    private Integer level;

    /**
     * 父级编码 (用于点位关联区块)
     */
    private String parentCode;

    /**
     * 曝光量
     */
    private Long exposureCount;

    /**
     * 点击量
     */
    private Long clickCount;

    /**
     * 曝光用户数 (唯一 anonymous_id)
     */
    private Long exposureUsers;

    /**
     * 点击用户数 (唯一 anonymous_id)
     */
    private Long clickUsers;

    /**
     * 曝光率 (曝光量/页面访问量)
     */
    private BigDecimal exposureRate;

    /**
     * 点击率 (点击量/曝光量)
     */
    private BigDecimal clickRate;

    /**
     * 渗透率 (点击量/曝光量，注：也叫渗透深度)
     */
    private BigDecimal penetrationRate;

    public SpmStatsDTO() {
        this.exposureCount = 0L;
        this.clickCount = 0L;
        this.exposureUsers = 0L;
        this.clickUsers = 0L;
        this.exposureRate = BigDecimal.ZERO;
        this.clickRate = BigDecimal.ZERO;
        this.penetrationRate = BigDecimal.ZERO;
    }
}