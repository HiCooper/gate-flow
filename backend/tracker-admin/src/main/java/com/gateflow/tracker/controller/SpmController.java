package com.gateflow.tracker.controller;

import com.gateflow.tracker.domain.dto.*;
import com.gateflow.tracker.service.SpmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "SPM API", description = "SPM层级管理接口")
@RestController
@RequestMapping("/api/v1/spm")
@RequiredArgsConstructor
public class SpmController {

    private final SpmService spmService;

    // === 查询接口 ===

    @GetMapping
    @Operation(summary = "SPM列表（扁平）")
    public ResponseEntity<ApiResponse<List<SpmVO>>> listSpms(
            @Parameter(description = "层级过滤：0=SPMA 1=SPMB 2=SPMC 3=SPMD")
            @RequestParam(required = false) Integer level,
            @Parameter(description = "编码关键字（模糊搜索）")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "顶级父级 ID（筛选该 SPM 及其所有后代）")
            @RequestParam(required = false) Long rootId) {
        List<SpmVO> result;
        if (keyword != null || rootId != null) {
            result = spmService.searchSpms(level, keyword, rootId);
        } else if (level != null) {
            result = spmService.listByLevel(level);
        } else {
            result = spmService.listSpms();
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/tree")
    @Operation(summary = "SPM树形结构")
    public ResponseEntity<ApiResponse<List<SpmVO>>> getSpmTree() {
        return ResponseEntity.ok(ApiResponse.success(spmService.listSpmTree()));
    }

    @GetMapping("/parents")
    @Operation(summary = "获取可选的父级列表")
    public ResponseEntity<ApiResponse<List<SpmVO>>> getAvailableParents(
            @Parameter(description = "当前层级，用于过滤可选的父级")
            @RequestParam Integer level) {
        return ResponseEntity.ok(ApiResponse.success(spmService.getAvailableParents(level)));
    }

    @GetMapping("/children")
    @Operation(summary = "获取子节点列表")
    public ResponseEntity<ApiResponse<List<SpmVO>>> getChildren(
            @Parameter(description = "父级ID")
            @RequestParam(required = false) Long parentId) {
        return ResponseEntity.ok(ApiResponse.success(spmService.getChildren(parentId)));
    }

    @GetMapping("/has-children")
    @Operation(summary = "检查SPM是否有子节点")
    public ResponseEntity<ApiResponse<Boolean>> hasChildren(
            @Parameter(description = "SPM ID")
            @RequestParam Long id) {
        return ResponseEntity.ok(ApiResponse.success(spmService.hasChildren(id)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取SPM详情")
    public ResponseEntity<ApiResponse<SpmVO>> getSpm(
            @Parameter(description = "SPM ID") @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(spmService.getSpmById(id)));
    }

    @GetMapping("/{id}/breadcrumb")
    @Operation(summary = "获取SPM面包屑路径")
    public ResponseEntity<ApiResponse<List<SpmVO>>> getBreadcrumb(
            @Parameter(description = "SPM ID") @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(spmService.getBreadcrumb(id)));
    }

    // === 写入接口 ===

    @PostMapping
    @Operation(summary = "创建SPM")
    public ResponseEntity<ApiResponse<SpmVO>> createSpm(
            @Valid @RequestBody CreateSpmRequest request) {
        return ResponseEntity.ok(ApiResponse.success(spmService.createSpm(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新SPM")
    public ResponseEntity<ApiResponse<SpmVO>> updateSpm(
            @Parameter(description = "SPM ID") @PathVariable Long id,
            @Valid @RequestBody CreateSpmRequest request) {
        return ResponseEntity.ok(ApiResponse.success(spmService.updateSpm(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除SPM")
    public ResponseEntity<ApiResponse<Void>> deleteSpm(
            @Parameter(description = "SPM ID") @PathVariable Long id) {
        spmService.deleteSpm(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    @PostMapping("/move")
    @Operation(summary = "移动SPM到新的父级")
    public ResponseEntity<ApiResponse<Void>> moveSpm(
            @Parameter(description = "SPM ID") @RequestParam Long id,
            @Parameter(description = "新的父级ID，null表示移动到根节点") @RequestParam(required = false) Long parentId) {
        spmService.moveSpm(id, parentId);
        return ResponseEntity.ok(ApiResponse.success("Moved", null));
    }

    @PostMapping("/sort")
    @Operation(summary = "调整SPM排序")
    public ResponseEntity<ApiResponse<Void>> sortSpm(
            @Parameter(description = "SPM ID") @RequestParam Long id,
            @Parameter(description = "新的排序值") @RequestParam Integer order) {
        spmService.sortSpm(id, order);
        return ResponseEntity.ok(ApiResponse.success("Sorted", null));
    }
}