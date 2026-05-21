package com.gateflow.tracker.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gateflow.tracker.domain.dto.SpmStatsDTO;
import com.gateflow.tracker.domain.entity.TrackerSpm;
import com.gateflow.tracker.repository.ClickHouseSpmRepository;
import com.gateflow.tracker.repository.TrackerSpmMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpmAnalyticsService {

    private final ClickHouseSpmRepository clickHouseRepo;
    private final TrackerSpmMapper spmMapper;

    // ---- SPM 定义查询 (MySQL) ----

    public TrackerSpm getSpmByCode(String spmCode) {
        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TrackerSpm::getSpmCode, spmCode);
        return spmMapper.selectOne(wrapper);
    }

    public TrackerSpm getSpmById(Long spmId) {
        return spmMapper.selectById(spmId);
    }

    public List<TrackerSpm> getChildBlocks(Long parentId) {
        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TrackerSpm::getParentId, parentId).eq(TrackerSpm::getLevel, 2);
        return spmMapper.selectList(wrapper);
    }

    public List<TrackerSpm> getActiveSpmsByLevel(int level) {
        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TrackerSpm::getLevel, level).eq(TrackerSpm::getStatus, 1);
        return spmMapper.selectList(wrapper);
    }

    // ---- 分析查询 (ClickHouse) ----

    /**
     * 全局 SPM 统计：所有活跃区块和点位的曝光/点击聚合
     */
    public SpmStatsResult getGlobalStats(String appId, Long startTimeMs, Long endTimeMs) {
        List<TrackerSpm> blocks = getActiveSpmsByLevel(2);
        List<TrackerSpm> spots = getActiveSpmsByLevel(3);

        List<SpmStatsDTO> blockStats = new ArrayList<>();
        for (TrackerSpm block : blocks) {
            SpmStatsDTO stats = calcStatsForSpm(block.getSpmCode(), block.getSpmName(),
                    2, null, startTimeMs, endTimeMs);
            blockStats.add(stats);
        }

        List<SpmStatsDTO> spotStats = new ArrayList<>();
        for (TrackerSpm spot : spots) {
            String parentCode = blocks.stream()
                    .filter(b -> spot.getParentId() != null && spot.getParentId().equals(b.getId()))
                    .map(TrackerSpm::getSpmCode)
                    .findFirst().orElse(null);
            SpmStatsDTO stats = calcStatsForSpm(spot.getSpmCode(), spot.getSpmName(),
                    3, parentCode, startTimeMs, endTimeMs);
            spotStats.add(stats);
        }

        return new SpmStatsResult(blockStats, spotStats, blocks.size() + spots.size());
    }

    /**
     * 单个 SPM 统计
     */
    public SpmStatsDTO getStatsForCode(String spmCode, String spmName, Integer level,
                                         Long startTimeMs, Long endTimeMs) {
        return calcStatsForSpm(spmCode, spmName, level, null, startTimeMs, endTimeMs);
    }

    /**
     * 页面概览统计
     */
    public Map<String, Object> getPageOverview(TrackerSpm pageSpm, Long startTimeMs, Long endTimeMs) {
        ClickHouseSpmRepository.SpmParts parts = ClickHouseSpmRepository.SpmParts.parse(pageSpm.getSpmCode());
        List<ClickHouseSpmRepository.SpmAggRow> rows = clickHouseRepo.queryPageOverview(
                parts.spma, parts.spmb, startTimeMs, endTimeMs);

        long exposurePv = 0, exposureUv = 0, clickPv = 0, clickUv = 0;
        for (ClickHouseSpmRepository.SpmAggRow row : rows) {
            switch (row.eventType) {
                case "exposure" -> { exposurePv = row.pv; exposureUv = row.uv; }
                case "click"    -> { clickPv = row.pv; clickUv = row.uv; }
            }
        }

        List<TrackerSpm> blocks = getChildBlocks(pageSpm.getId());
        double penetrationRate = exposureUv > 0 ? (double) clickUv / exposureUv : 0.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("spmId", pageSpm.getId());
        result.put("spmCode", pageSpm.getSpmCode());
        result.put("spmName", pageSpm.getSpmName());
        result.put("exposurePv", exposurePv);
        result.put("exposureUv", exposureUv);
        result.put("clickPv", clickPv);
        result.put("clickUv", clickUv);
        result.put("penetrationRate", Math.round(penetrationRate * 10000.0) / 10000.0);
        result.put("avgStayDuration", 0.0);
        result.put("blockCount", blocks.size());
        return result;
    }

    /**
     * 页面下区块列表（含统计）
     */
    public List<Map<String, Object>> getPageBlockStats(String pageSpmCode,
                                                         List<TrackerSpm> blocks,
                                                         Long startTimeMs, Long endTimeMs) {
        ClickHouseSpmRepository.SpmParts parts = ClickHouseSpmRepository.SpmParts.parse(pageSpmCode);
        List<ClickHouseSpmRepository.SpmAggRow> rows = clickHouseRepo.queryPageBlocks(
                parts.spma, parts.spmb, startTimeMs, endTimeMs);

        // 按 spmc 分组：每个 block 有其 spmc
        Map<String, List<ClickHouseSpmRepository.SpmAggRow>> bySpmc = rows.stream()
                .collect(Collectors.groupingBy(r -> r.spmc != null ? r.spmc : ""));

        return blocks.stream().map(block -> {
            ClickHouseSpmRepository.SpmParts bp = ClickHouseSpmRepository.SpmParts.parse(block.getSpmCode());
            List<ClickHouseSpmRepository.SpmAggRow> blockRows = bySpmc.getOrDefault(
                    bp.spmc != null ? bp.spmc : "", Collections.emptyList());

            long expPv = 0, expUv = 0, clkPv = 0, clkUv = 0;
            for (ClickHouseSpmRepository.SpmAggRow row : blockRows) {
                switch (row.eventType) {
                    case "exposure" -> { expPv = row.pv; expUv = row.uv; }
                    case "click" -> { clkPv = row.pv; clkUv = row.uv; }
                }
            }

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", block.getId());
            m.put("spmCode", block.getSpmCode());
            m.put("spmName", block.getSpmName());
            m.put("parentId", block.getParentId());
            m.put("sortOrder", block.getSortOrder());
            m.put("exposurePv", expPv);
            m.put("exposureUv", expUv);
            m.put("clickPv", clkPv);
            m.put("clickUv", clkUv);

            long total = expPv + clkPv;
            double exposureRate = total > 0 ? (double) expPv / total : 0.0;
            double clickRate = expPv > 0 ? (double) clkPv / expPv : 0.0;
            double penetrationRate = expUv > 0 ? (double) clkUv / expUv : 0.0;

            m.put("exposureRate", Math.round(exposureRate * 10000.0) / 10000.0);
            m.put("clickRate", Math.round(clickRate * 10000.0) / 10000.0);
            m.put("penetrationRate", Math.round(penetrationRate * 10000.0) / 10000.0);
            return m;
        }).collect(Collectors.toList());
    }

    /**
     * 事件分页列表查询
     */
    public ClickHouseSpmRepository.EventListResult queryEventList(String spmCode, String eventType,
                                                                    Long startTimeMs, Long endTimeMs,
                                                                    int page, int size) {
        ClickHouseSpmRepository.SpmParts parts = ClickHouseSpmRepository.SpmParts.parse(spmCode);
        return clickHouseRepo.queryEventList(parts, eventType, startTimeMs, endTimeMs,
                (page - 1) * size, size);
    }

    // ---- 内部计算 ----

    private SpmStatsDTO calcStatsForSpm(String spmCode, String spmName, Integer level,
                                          String parentCode, Long startMs, Long endMs) {
        ClickHouseSpmRepository.SpmParts parts = ClickHouseSpmRepository.SpmParts.parse(spmCode);
        List<ClickHouseSpmRepository.SpmAggRow> rows = clickHouseRepo.querySpmAgg(
                spmCode, null, startMs, endMs);

        long exposurePv = 0, exposureUv = 0, clickPv = 0, clickUv = 0;
        for (ClickHouseSpmRepository.SpmAggRow row : rows) {
            // 只统计精确匹配该 SPM code 的行
            if (!spmCode.equals(buildSpmFromRow(row))) continue;
            switch (row.eventType) {
                case "exposure" -> { exposurePv += row.pv; exposureUv += row.uv; }
                case "click"    -> { clickPv += row.pv; clickUv += row.uv; }
            }
        }

        SpmStatsDTO stats = new SpmStatsDTO();
        stats.setSpmCode(spmCode);
        stats.setSpmName(spmName);
        stats.setLevel(level);
        stats.setParentCode(parentCode);
        stats.setExposureCount(exposurePv);
        stats.setExposureUsers(exposureUv);
        stats.setClickCount(clickPv);
        stats.setClickUsers(clickUv);

        BigDecimal bdPv = BigDecimal.valueOf(Math.max(exposureUv + clickUv, 1));
        BigDecimal bdExp = BigDecimal.valueOf(exposurePv);
        BigDecimal bdClk = BigDecimal.valueOf(clickPv);

        if (bdPv.compareTo(BigDecimal.ZERO) > 0) {
            stats.setExposureRate(bdExp.divide(bdPv, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)));
        }
        if (bdExp.compareTo(BigDecimal.ZERO) > 0) {
            stats.setClickRate(bdClk.divide(bdExp, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)));
            stats.setPenetrationRate(stats.getClickRate());
        }

        return stats;
    }

    private String buildSpmFromRow(ClickHouseSpmRepository.SpmAggRow row) {
        return Arrays.stream(new String[]{row.spma, row.spmb, row.spmc, row.spmd})
                .filter(Objects::nonNull)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining("."));
    }

    public record SpmStatsResult(List<SpmStatsDTO> blockStats, List<SpmStatsDTO> spotStats, int total) {}
}
