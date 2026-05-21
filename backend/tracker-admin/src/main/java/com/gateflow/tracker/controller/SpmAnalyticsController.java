package com.gateflow.tracker.controller;

import com.gateflow.tracker.domain.dto.ApiResponse;
import com.gateflow.tracker.domain.dto.PageResponse;
import com.gateflow.tracker.domain.dto.SpmStatsDTO;
import com.gateflow.tracker.domain.entity.TrackerSpm;
import com.gateflow.tracker.repository.ClickHouseSpmRepository;
import com.gateflow.tracker.service.SpmAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@Tag(name = "SPM Analytics API", description = "SPM事件分析接口")
@RestController
@RequestMapping("/api/v1/spm-analytics")
@RequiredArgsConstructor
public class SpmAnalyticsController {

    private final SpmAnalyticsService spmAnalyticsService;

    @GetMapping("/events")
    @Operation(summary = "查询SPM事件列表")
    public ResponseEntity<PageResponse<Map<String, Object>>> listEvents(
            @Parameter(description = "SPM编码")
            @RequestParam(required = false) String spmCode,
            @Parameter(description = "事件类型")
            @RequestParam(required = false) String eventType,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") Integer size) {

        ClickHouseSpmRepository.EventListResult result = spmAnalyticsService.queryEventList(
                spmCode, eventType, toEpochMillis(startTime), toEpochMillis(endTime), page, size);

        return ResponseEntity.ok(PageResponse.of(result.events, result.total, page, size));
    }

    @GetMapping("/stats")
    @Operation(summary = "获取全局SPM区块和点位统计")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @Parameter(description = "应用ID")
            @RequestParam(required = false) String appId,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        SpmAnalyticsService.SpmStatsResult statsResult = spmAnalyticsService.getGlobalStats(
                appId, toEpochMillis(startTime), toEpochMillis(endTime));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("blockStats", statsResult.blockStats());
        result.put("spotStats", statsResult.spotStats());
        result.put("total", statsResult.total());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/stats/{spmCode}")
    @Operation(summary = "获取指定SPM的统计详情")
    public ResponseEntity<ApiResponse<SpmStatsDTO>> getStatsByCode(
            @PathVariable String spmCode,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        TrackerSpm spm = spmAnalyticsService.getSpmByCode(spmCode);
        if (spm == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(404, "SPM not found: " + spmCode));
        }

        SpmStatsDTO stats = spmAnalyticsService.getStatsForCode(
                spmCode, spm.getSpmName(), spm.getLevel(),
                toEpochMillis(startTime), toEpochMillis(endTime));

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/page-overview")
    @Operation(summary = "获取页面统计概览")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPageOverview(
            @Parameter(description = "页面SPM ID")
            @RequestParam Long spmId,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        TrackerSpm page = spmAnalyticsService.getSpmById(spmId);
        if (page == null || page.getLevel() != 1) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(404, "Page not found or not a page level SPM"));
        }

        Map<String, Object> overview = spmAnalyticsService.getPageOverview(
                page, toEpochMillis(startTime), toEpochMillis(endTime));

        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/page-blocks")
    @Operation(summary = "获取页面的区块列表")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPageBlocks(
            @Parameter(description = "页面SPM ID")
            @RequestParam Long spmId,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        TrackerSpm pageSpm = spmAnalyticsService.getSpmById(spmId);
        if (pageSpm == null || pageSpm.getLevel() != 1) {
            return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
        }

        List<TrackerSpm> blocks = spmAnalyticsService.getChildBlocks(spmId);
        List<Map<String, Object>> blockStats = spmAnalyticsService.getPageBlockStats(
                pageSpm.getSpmCode(), blocks,
                toEpochMillis(startTime), toEpochMillis(endTime));

        return ResponseEntity.ok(ApiResponse.success(blockStats));
    }

    private static Long toEpochMillis(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
    }
}
