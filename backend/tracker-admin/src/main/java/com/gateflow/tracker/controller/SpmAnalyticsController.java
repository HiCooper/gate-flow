package com.gateflow.tracker.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gateflow.tracker.domain.dto.ApiResponse;
import com.gateflow.tracker.domain.dto.PageResponse;
import com.gateflow.tracker.domain.dto.SpmStatsDTO;
import com.gateflow.tracker.domain.entity.TrackerEventRaw;
import com.gateflow.tracker.domain.entity.TrackerSpm;
import com.gateflow.tracker.repository.TrackerEventRawMapper;
import com.gateflow.tracker.repository.TrackerSpmMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static java.util.stream.Collectors.*;

@Tag(name = "SPM Analytics API", description = "SPM事件分析接口")
@RestController
@RequestMapping("/api/v1/spm-analytics")
@RequiredArgsConstructor
public class SpmAnalyticsController {

    private final TrackerEventRawMapper eventRawMapper;
    private final TrackerSpmMapper spmMapper;

    @GetMapping("/events")
    @Operation(summary = "查询SPM事件列表")
    public ResponseEntity<PageResponse<Map<String, Object>>> listEvents(
            @Parameter(description = "SPM编码")
            @RequestParam(required = false) String spmCode,
            @Parameter(description = "事件类型")
            @RequestParam(required = false) String eventType,
            @Parameter(description = "应用ID")
            @RequestParam(required = false) String appId,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") Integer size) {

        LambdaQueryWrapper<TrackerEventRaw> wrapper = new LambdaQueryWrapper<>();

        if (spmCode != null && !spmCode.isEmpty()) {
            wrapper.like(TrackerEventRaw::getSpmCode, spmCode);
        }
        if (eventType != null && !eventType.isEmpty()) {
            wrapper.eq(TrackerEventRaw::getEventType, eventType);
        }
        if (appId != null && !appId.isEmpty()) {
            wrapper.eq(TrackerEventRaw::getAppId, appId);
        }
        if (startTime != null) {
            wrapper.ge(TrackerEventRaw::getTimestamp, startTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
        }
        if (endTime != null) {
            wrapper.le(TrackerEventRaw::getTimestamp, endTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
        }

        wrapper.orderByDesc(TrackerEventRaw::getCreatedAt);

        Page<TrackerEventRaw> pageParam = new Page<>(page, size);
        Page<TrackerEventRaw> result = eventRawMapper.selectPage(pageParam, wrapper);

        List<Map<String, Object>> records = result.getRecords().stream()
                .map(this::toMap)
                .collect(toList());

        return ResponseEntity.ok(PageResponse.of(records, result.getTotal(), page, size));
    }

    @GetMapping("/summary")
    @Operation(summary = "获取SPM事件汇总统计")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(
            @Parameter(description = "SPM编码")
            @RequestParam(required = false) String spmCode,
            @Parameter(description = "应用ID")
            @RequestParam(required = false) String appId) {

        Map<String, Object> summary = new HashMap<>();

        LambdaQueryWrapper<TrackerEventRaw> wrapper = new LambdaQueryWrapper<>();
        if (spmCode != null && !spmCode.isEmpty()) {
            wrapper.like(TrackerEventRaw::getSpmCode, spmCode);
        }
        if (appId != null && !appId.isEmpty()) {
            wrapper.eq(TrackerEventRaw::getAppId, appId);
        }

        Long totalCount = eventRawMapper.selectCount(wrapper);
        summary.put("totalCount", totalCount);

        List<TrackerEventRaw> events = eventRawMapper.selectList(wrapper);
        Map<String, Long> eventTypeCount = events.stream()
                .collect(groupingBy(
                        e -> e.getEventType() != null ? e.getEventType() : "unknown",
                        counting()
                ));
        summary.put("eventTypeCount", eventTypeCount);

        Map<String, Long> spmCodeCount = events.stream()
                .filter(e -> e.getSpmCode() != null)
                .collect(groupingBy(TrackerEventRaw::getSpmCode, counting()));
        summary.put("spmCodeCount", spmCodeCount);

        long uniqueUsers = events.stream()
                .filter(e -> e.getAnonymousId() != null)
                .map(TrackerEventRaw::getAnonymousId)
                .distinct()
                .count();
        summary.put("uniqueUsers", uniqueUsers);

        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/spm/{spmCode}/events")
    @Operation(summary = "获取指定SPM的事件列表")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSpmEvents(
            @PathVariable String spmCode) {

        LambdaQueryWrapper<TrackerEventRaw> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TrackerEventRaw::getSpmCode, spmCode)
                .orderByDesc(TrackerEventRaw::getCreatedAt)
                .last("LIMIT 100");

        List<Map<String, Object>> records = eventRawMapper.selectList(wrapper).stream()
                .map(this::toMap)
                .collect(toList());

        return ResponseEntity.ok(ApiResponse.success(records));
    }

    private Map<String, Object> toMap(TrackerEventRaw event) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", event.getId());
        map.put("eventId", event.getEventId());
        map.put("eventType", event.getEventType());
        map.put("anonymousId", event.getAnonymousId());
        map.put("timestamp", event.getTimestamp());
        map.put("appId", event.getAppId());
        map.put("platform", event.getPlatform());
        map.put("pageUrl", event.getPageUrl());
        map.put("pageTitle", event.getPageTitle());
        map.put("spmCode", event.getSpmCode());
        map.put("spmLevel", event.getSpmLevel());
        map.put("elementId", event.getElementId());
        map.put("elementType", event.getElementType());
        map.put("elementText", event.getElementText());
        map.put("clickX", event.getClickX());
        map.put("clickY", event.getClickY());
        map.put("exposureRatio", event.getExposureRatio());
        map.put("createdAt", event.getCreatedAt());
        return map;
    }

    @GetMapping("/stats")
    @Operation(summary = "获取SPM区块和点位统计")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @Parameter(description = "应用ID")
            @RequestParam(required = false) String appId,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        // 构建基础查询条件
        LambdaQueryWrapper<TrackerEventRaw> baseWrapper = new LambdaQueryWrapper<>();
        if (appId != null && !appId.isEmpty()) {
            baseWrapper.eq(TrackerEventRaw::getAppId, appId);
        }
        if (startTime != null) {
            baseWrapper.ge(TrackerEventRaw::getTimestamp, startTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
        }
        if (endTime != null) {
            baseWrapper.le(TrackerEventRaw::getTimestamp, endTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
        }

        // 获取所有事件数据用于统计
        List<TrackerEventRaw> allEvents = eventRawMapper.selectList(baseWrapper);

        // 计算页面访问量（用于曝光率计算）
        long pageViews = allEvents.stream()
                .filter(e -> e.getAnonymousId() != null)
                .map(TrackerEventRaw::getAnonymousId)
                .distinct()
                .count();
        if (pageViews == 0) {
            pageViews = 1L; // 避免除零
        }

        // 获取所有区块(SPMC, level=3)配置
        LambdaQueryWrapper<TrackerSpm> spmWrapper = new LambdaQueryWrapper<>();
        spmWrapper.eq(TrackerSpm::getLevel, 3)
                .eq(TrackerSpm::getStatus, 1);
        List<TrackerSpm> blocks = spmMapper.selectList(spmWrapper);

        // 计算区块统计
        List<SpmStatsDTO> blockStats = new ArrayList<>();
        for (TrackerSpm block : blocks) {
            String blockCode = block.getSpmCode();
            SpmStatsDTO stats = calculateStats(blockCode, block.getSpmName(), 3, null, allEvents, pageViews);
            blockStats.add(stats);
        }

        // 计算点位统计
        LambdaQueryWrapper<TrackerSpm> spotWrapper = new LambdaQueryWrapper<>();
        spotWrapper.eq(TrackerSpm::getLevel, 4)
                .eq(TrackerSpm::getStatus, 1);
        List<TrackerSpm> spots = spmMapper.selectList(spotWrapper);

        List<SpmStatsDTO> spotStats = new ArrayList<>();
        for (TrackerSpm spot : spots) {
            // 找到父级区块
            String parentCode = null;
            for (TrackerSpm block : blocks) {
                if (spot.getParentId() != null && spot.getParentId().equals(block.getId())) {
                    parentCode = block.getSpmCode();
                    break;
                }
            }
            SpmStatsDTO stats = calculateStats(spot.getSpmCode(), spot.getSpmName(), 4, parentCode, allEvents, pageViews);
            spotStats.add(stats);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("blockStats", blockStats);
        result.put("spotStats", spotStats);
        result.put("pageViews", pageViews);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/stats/{spmCode}")
    @Operation(summary = "获取指定SPM的统计详情")
    public ResponseEntity<ApiResponse<SpmStatsDTO>> getStatsByCode(
            @PathVariable String spmCode,
            @Parameter(description = "应用ID")
            @RequestParam(required = false) String appId,
            @Parameter(description = "开始时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        // 获取SPM信息
        LambdaQueryWrapper<TrackerSpm> spmWrapper = new LambdaQueryWrapper<>();
        spmWrapper.eq(TrackerSpm::getSpmCode, spmCode);
        TrackerSpm spm = spmMapper.selectOne(spmWrapper);

        if (spm == null) {
            return ResponseEntity.ok(ApiResponse.error(404, "SPM not found"));
        }

        // 构建查询条件
        LambdaQueryWrapper<TrackerEventRaw> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TrackerEventRaw::getSpmCode, spmCode);
        if (appId != null && !appId.isEmpty()) {
            wrapper.eq(TrackerEventRaw::getAppId, appId);
        }
        if (startTime != null) {
            wrapper.ge(TrackerEventRaw::getTimestamp, startTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
        }
        if (endTime != null) {
            wrapper.le(TrackerEventRaw::getTimestamp, endTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
        }

        List<TrackerEventRaw> events = eventRawMapper.selectList(wrapper);

        // 计算页面访问量
        long pageViews = events.stream()
                .filter(e -> e.getAnonymousId() != null)
                .map(TrackerEventRaw::getAnonymousId)
                .distinct()
                .count();
        if (pageViews == 0) {
            pageViews = 1L;
        }

        SpmStatsDTO stats = calculateStats(spmCode, spm.getSpmName(), spm.getLevel(), null, events, pageViews);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    private SpmStatsDTO calculateStats(String spmCode, String spmName, Integer level, String parentCode, List<TrackerEventRaw> allEvents, long pageViews) {
        SpmStatsDTO stats = new SpmStatsDTO();
        stats.setSpmCode(spmCode);
        stats.setSpmName(spmName);
        stats.setLevel(level);
        stats.setParentCode(parentCode);

        // 按事件类型分组
        Map<String, List<TrackerEventRaw>> byEventType = allEvents.stream()
                .filter(e -> spmCode.equals(e.getSpmCode()))
                .collect(groupingBy(
                        e -> e.getEventType() != null ? e.getEventType() : "unknown",
                        toList()
                ));

        // 曝光事件统计
        List<TrackerEventRaw> exposureEvents = byEventType.getOrDefault("exposure", Collections.emptyList());
        stats.setExposureCount((long) exposureEvents.size());
        stats.setExposureUsers(exposureEvents.stream()
                .filter(e -> e.getAnonymousId() != null)
                .map(TrackerEventRaw::getAnonymousId)
                .distinct()
                .count());

        // 点击事件统计
        List<TrackerEventRaw> clickEvents = byEventType.getOrDefault("click", Collections.emptyList());
        stats.setClickCount((long) clickEvents.size());
        stats.setClickUsers(clickEvents.stream()
                .filter(e -> e.getAnonymousId() != null)
                .map(TrackerEventRaw::getAnonymousId)
                .distinct()
                .count());

        // 计算比率
        BigDecimal bdPageViews = BigDecimal.valueOf(pageViews);
        BigDecimal bdExposureCount = BigDecimal.valueOf(stats.getExposureCount());
        BigDecimal bdClickCount = BigDecimal.valueOf(stats.getClickCount());

        // 曝光率 = 曝光量 / 页面访问量
        if (bdPageViews.compareTo(BigDecimal.ZERO) > 0) {
            stats.setExposureRate(bdExposureCount.divide(bdPageViews, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)));
        }

        // 点击率 = 点击量 / 曝光量
        if (bdExposureCount.compareTo(BigDecimal.ZERO) > 0) {
            stats.setClickRate(bdClickCount.divide(bdExposureCount, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)));
            // 渗透率 = 点击量 / 曝光量 (同上)
            stats.setPenetrationRate(stats.getClickRate());
        }

        return stats;
    }

    @GetMapping("/page-overview")
    @Operation(summary = "获取页面统计概览")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPageOverview(
            @Parameter(description = "页面SPM ID")
            @RequestParam Long spmId) {

        // 获取页面信息
        TrackerSpm page = spmMapper.selectById(spmId);
        if (page == null || page.getLevel() != 1) {
            return ResponseEntity.ok(ApiResponse.error(404, "Page not found or not a page level SPM"));
        }

        // 获取该页面的所有子节点（区块）
        LambdaQueryWrapper<TrackerSpm> blockWrapper = new LambdaQueryWrapper<>();
        blockWrapper.eq(TrackerSpm::getParentId, spmId)
                    .eq(TrackerSpm::getLevel, 2);
        List<TrackerSpm> blocks = spmMapper.selectList(blockWrapper);

        // 构建区块编码列表用于查询
        List<String> blockCodes = blocks.stream()
                .map(TrackerSpm::getSpmCode)
                .collect(toList());

        // 获取该页面路径前缀（用于匹配点位）
        String pagePathPrefix = page.getPath() + "_";

        // 查询所有相关事件
        LambdaQueryWrapper<TrackerEventRaw> eventWrapper = new LambdaQueryWrapper<>();
        eventWrapper.likeRight(TrackerEventRaw::getSpmCode, page.getSpmCode());

        List<TrackerEventRaw> allEvents = eventRawMapper.selectList(eventWrapper);

        // 统计页面级别事件
        long exposurePv = allEvents.stream()
                .filter(e -> page.getSpmCode().equals(e.getSpmCode()) && "exposure".equals(e.getEventType()))
                .count();
        long exposureUv = allEvents.stream()
                .filter(e -> page.getSpmCode().equals(e.getSpmCode()) && "exposure".equals(e.getEventType()))
                .filter(e -> e.getAnonymousId() != null)
                .map(TrackerEventRaw::getAnonymousId)
                .distinct()
                .count();
        long clickPv = allEvents.stream()
                .filter(e -> page.getSpmCode().equals(e.getSpmCode()) && "click".equals(e.getEventType()))
                .count();
        long clickUv = allEvents.stream()
                .filter(e -> page.getSpmCode().equals(e.getSpmCode()) && "click".equals(e.getEventType()))
                .filter(e -> e.getAnonymousId() != null)
                .map(TrackerEventRaw::getAnonymousId)
                .distinct()
                .count();

        // 计算渗透率
        double penetrationRate = exposureUv > 0 ? (double) clickUv / exposureUv : 0.0;

        // 构建结果
        Map<String, Object> result = new HashMap<>();
        result.put("spmId", page.getId());
        result.put("spmCode", page.getSpmCode());
        result.put("spmName", page.getSpmName());
        result.put("exposurePv", exposurePv);
        result.put("exposureUv", exposureUv);
        result.put("clickPv", clickPv);
        result.put("clickUv", clickUv);
        result.put("penetrationRate", penetrationRate);
        result.put("avgStayDuration", 0.0); // TODO: 需要从 session 数据计算
        result.put("blockCount", blocks.size());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/page-blocks")
    @Operation(summary = "获取页面的区块列表（分页）")
    public ResponseEntity<PageResponse<Map<String, Object>>> getPageBlocks(
            @Parameter(description = "页面SPM ID")
            @RequestParam Long spmId,
            @Parameter(description = "页码")
            @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页大小")
            @RequestParam(defaultValue = "10") Integer pageSize) {

        // 获取页面信息
        TrackerSpm pageSpm = spmMapper.selectById(spmId);
        if (pageSpm == null || pageSpm.getLevel() != 1) {
            return ResponseEntity.ok(PageResponse.of(Collections.emptyList(), 0L, pageNum, pageSize));
        }

        // 获取该页面的所有子节点（区块）
        LambdaQueryWrapper<TrackerSpm> blockWrapper = new LambdaQueryWrapper<>();
        blockWrapper.eq(TrackerSpm::getParentId, spmId)
                    .eq(TrackerSpm::getLevel, 2);

        List<TrackerSpm> allBlocks = spmMapper.selectList(blockWrapper);

        // 查询该页面的所有事件
        LambdaQueryWrapper<TrackerEventRaw> eventWrapper = new LambdaQueryWrapper<>();
        eventWrapper.likeRight(TrackerEventRaw::getSpmCode, pageSpm.getSpmCode());
        List<TrackerEventRaw> allEvents = eventRawMapper.selectList(eventWrapper);

        // 计算分页
        int total = allBlocks.size();
        int fromIndex = (pageNum - 1) * pageSize;
        int toIndex = Math.min(fromIndex + pageSize, total);

        // 转换区块数据并添加统计信息
        List<Map<String, Object>> blockList;
        if (fromIndex >= total) {
            blockList = Collections.emptyList();
        } else {
            blockList = allBlocks.subList(fromIndex, toIndex).stream()
                    .map(block -> {
                        Map<String, Object> blockMap = new HashMap<>();
                        blockMap.put("id", block.getId());
                        blockMap.put("spmCode", block.getSpmCode());
                        blockMap.put("spmName", block.getSpmName());
                        blockMap.put("parentId", block.getParentId());
                        blockMap.put("sortOrder", block.getSortOrder());

                        // 计算该区块的事件统计
                        long expPv = allEvents.stream()
                                .filter(e -> block.getSpmCode().equals(e.getSpmCode()) && "exposure".equals(e.getEventType()))
                                .count();
                        long expUv = allEvents.stream()
                                .filter(e -> block.getSpmCode().equals(e.getSpmCode()) && "exposure".equals(e.getEventType()))
                                .filter(e -> e.getAnonymousId() != null)
                                .map(TrackerEventRaw::getAnonymousId)
                                .distinct()
                                .count();
                        long clkPv = allEvents.stream()
                                .filter(e -> block.getSpmCode().equals(e.getSpmCode()) && "click".equals(e.getEventType()))
                                .count();
                        long clkUv = allEvents.stream()
                                .filter(e -> block.getSpmCode().equals(e.getSpmCode()) && "click".equals(e.getEventType()))
                                .filter(e -> e.getAnonymousId() != null)
                                .map(TrackerEventRaw::getAnonymousId)
                                .distinct()
                                .count();

                        blockMap.put("exposurePv", expPv);
                        blockMap.put("exposureUv", expUv);
                        blockMap.put("clickPv", clkPv);
                        blockMap.put("clickUv", clkUv);

                        // 计算比率
                        double exposureRate = expPv > 0 ? (double) expPv / expPv : 0.0; // 简化计算
                        double clickRate = expPv > 0 ? (double) clkPv / expPv : 0.0;
                        double penetrationRate = expUv > 0 ? (double) clkUv / expUv : 0.0;

                        blockMap.put("exposureRate", exposureRate);
                        blockMap.put("clickRate", clickRate);
                        blockMap.put("penetrationRate", penetrationRate);

                        return blockMap;
                    })
                    .collect(toList());
        }

        return ResponseEntity.ok(PageResponse.of(blockList, (long) total, pageNum, pageSize));
    }
}