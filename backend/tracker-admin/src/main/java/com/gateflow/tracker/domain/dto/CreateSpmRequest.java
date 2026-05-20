package com.gateflow.tracker.domain.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSpmRequest {

    @NotBlank(message = "SPM名称不能为空")
    @Size(max = 128, message = "SPM名称长度不能超过128")
    private String spmName;

    @Size(max = 512, message = "描述长度不能超过512")
    private String description;

    private Integer status;

    // 层级结构字段
    @NotNull(message = "层级不能为空")
    @Min(value = 0, message = "层级最小值为0")
    private Integer level;

    // parentId 为 null 表示创建根节点(SPMA)
    private Long parentId;

    // 是否是分屏点位（仅 SPMD 使用，默认为 false）
    private Boolean isSplitSlot;
}