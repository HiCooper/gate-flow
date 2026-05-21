package com.gateflow.tracker.repository;

import com.gateflow.tracker.config.ClickHouseProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ClickHouse SPM 分析查询 Repository。
 * 直接从 ClickHouse events 表做 GROUP BY 聚合查询，利用列存引擎的向量化执行能力。
 */
@Repository
@Slf4j
public class ClickHouseSpmRepository {

    private final ClickHouseProperties clickHouseProperties;
    private volatile DataSource dataSource;

    public ClickHouseSpmRepository(ClickHouseProperties clickHouseProperties) {
        this.clickHouseProperties = clickHouseProperties;
    }

    private DataSource getDataSource() throws SQLException {
        if (dataSource == null) {
            synchronized (this) {
                if (dataSource == null) {
                    dataSource = clickHouseProperties.createDataSource();
                }
            }
        }
        return dataSource;
    }

    /**
     * 按 SPM 码 + 事件类型聚合统计。
     * 将 MySQL 中的 SPM code 拆分为 spma/spmb/spmc/spmd 后匹配 ClickHouse 列。
     */
    public List<SpmAggRow> querySpmAgg(String spmCodePrefix, String appId,
                                         Long startTimeMs, Long endTimeMs) {
        SpmParts parts = SpmParts.parse(spmCodePrefix);

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT spma, spmb, spmc, spmd, event_type, ");
        sql.append("count() as pv, uniq(anonymous_id) as uv ");
        sql.append("FROM gateflow_tracker.events ");
        sql.append("WHERE 1=1 ");

        List<Object> params = new ArrayList<>();
        appendSpmWhere(sql, params, parts);

        if (startTimeMs != null) {
            sql.append("AND timestamp >= ? ");
            params.add(toDateTime(startTimeMs));
        }
        if (endTimeMs != null) {
            sql.append("AND timestamp <= ? ");
            params.add(toDateTime(endTimeMs));
        }

        sql.append("GROUP BY spma, spmb, spmc, spmd, event_type ");
        sql.append("ORDER BY pv DESC LIMIT 10000");

        return executeQuery(sql.toString(), params, rs -> {
            SpmAggRow row = new SpmAggRow();
            row.spma = rs.getString("spma");
            row.spmb = rs.getString("spmb");
            row.spmc = rs.getString("spmc");
            row.spmd = rs.getString("spmd");
            row.eventType = rs.getString("event_type");
            row.pv = rs.getLong("pv");
            row.uv = rs.getLong("uv");
            return row;
        });
    }

    /**
     * 页面概览：按 event_type 聚合该页面下所有事件
     */
    public List<SpmAggRow> queryPageOverview(String spmaVal, String spmbVal,
                                               Long startTimeMs, Long endTimeMs) {
        String sql = """
                SELECT event_type, count() as pv, uniq(anonymous_id) as uv
                FROM gateflow_tracker.events
                WHERE spma = ? AND spmb = ?
                  AND timestamp >= ? AND timestamp <= ?
                GROUP BY event_type
                """;

        return executeQuery(sql, List.of(spmaVal, spmbVal,
                        toDateTime(startTimeMs != null ? startTimeMs : 0L),
                        toDateTime(endTimeMs != null ? endTimeMs : System.currentTimeMillis())),
                rs -> {
                    SpmAggRow row = new SpmAggRow();
                    row.eventType = rs.getString("event_type");
                    row.pv = rs.getLong("pv");
                    row.uv = rs.getLong("uv");
                    return row;
                });
    }

    /**
     * 页面下区块统计：按 spmc + event_type 聚合
     */
    public List<SpmAggRow> queryPageBlocks(String spmaVal, String spmbVal,
                                             Long startTimeMs, Long endTimeMs) {
        String sql = """
                SELECT spmc, event_type, count() as pv, uniq(anonymous_id) as uv
                FROM gateflow_tracker.events
                WHERE spma = ? AND spmb = ? AND spmc != ''
                  AND timestamp >= ? AND timestamp <= ?
                GROUP BY spmc, event_type
                ORDER BY pv DESC
                """;

        return executeQuery(sql, List.of(spmaVal, spmbVal,
                        toDateTime(startTimeMs != null ? startTimeMs : 0L),
                        toDateTime(endTimeMs != null ? endTimeMs : System.currentTimeMillis())),
                rs -> {
                    SpmAggRow row = new SpmAggRow();
                    row.spmc = rs.getString("spmc");
                    row.eventType = rs.getString("event_type");
                    row.pv = rs.getLong("pv");
                    row.uv = rs.getLong("uv");
                    return row;
                });
    }

    /**
     * 事件分页列表
     */
    public EventListResult queryEventList(SpmParts spmParts, String eventType,
                                            Long startTimeMs, Long endTimeMs,
                                            int offset, int limit) {
        StringBuilder countSql = new StringBuilder();
        countSql.append("SELECT count() as cnt FROM gateflow_tracker.events WHERE 1=1 ");
        List<Object> countParams = new ArrayList<>();
        appendSpmWhere(countSql, countParams, spmParts);

        StringBuilder dataSql = new StringBuilder();
        dataSql.append("SELECT event_id, event_type, anonymous_id, user_id, timestamp, ");
        dataSql.append("page_url, page_title, spma, spmb, spmc, spmd, ");
        dataSql.append("element_id, element_type, element_text, click_x, click_y, ");
        dataSql.append("device_type, os, browser ");
        dataSql.append("FROM gateflow_tracker.events WHERE 1=1 ");
        List<Object> dataParams = new ArrayList<>();
        appendSpmWhere(dataSql, dataParams, spmParts);

        if (eventType != null && !eventType.isEmpty()) {
            String cond = "AND event_type = ? ";
            countSql.append(cond);
            dataSql.append(cond);
            String et = eventType;
            countParams.add(et);
            dataParams.add(et);
        }
        if (startTimeMs != null) {
            String cond = "AND timestamp >= ? ";
            countSql.append(cond);
            dataSql.append(cond);
            countParams.add(toDateTime(startTimeMs));
            dataParams.add(toDateTime(startTimeMs));
        }
        if (endTimeMs != null) {
            String cond = "AND timestamp <= ? ";
            countSql.append(cond);
            dataSql.append(cond);
            countParams.add(toDateTime(endTimeMs));
            dataParams.add(toDateTime(endTimeMs));
        }

        dataSql.append("ORDER BY timestamp DESC LIMIT ? OFFSET ?");
        dataParams.add(limit);
        dataParams.add(offset);

        long total = executeQuery(countSql.toString(), countParams,
                rs -> rs.getLong(1)).stream().findFirst().orElse(0L);

        List<Map<String, Object>> events = executeQuery(dataSql.toString(), dataParams, rs -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("eventId", rs.getString("event_id"));
            map.put("eventType", rs.getString("event_type"));
            map.put("anonymousId", rs.getString("anonymous_id"));
            map.put("userId", rs.getString("user_id"));
            Timestamp ts = rs.getTimestamp("timestamp");
            map.put("timestamp", ts != null ? ts.getTime() : null);
            map.put("pageUrl", rs.getString("page_url"));
            map.put("pageTitle", rs.getString("page_title"));
            map.put("elementId", rs.getString("element_id"));
            map.put("elementType", rs.getString("element_type"));
            map.put("elementText", rs.getString("element_text"));
            map.put("clickX", rs.getObject("click_x"));
            map.put("clickY", rs.getObject("click_y"));
            map.put("deviceType", rs.getString("device_type"));
            map.put("os", rs.getString("os"));
            map.put("browser", rs.getString("browser"));
            return map;
        });

        return new EventListResult(total, events);
    }

    // ---- internal helpers ----

    private void appendSpmWhere(StringBuilder sql, List<Object> params, SpmParts parts) {
        if (parts.spma != null) {
            sql.append("AND spma = ? ");
            params.add(parts.spma);
        }
        if (parts.spmb != null) {
            sql.append("AND spmb = ? ");
            params.add(parts.spmb);
        }
        if (parts.spmc != null) {
            sql.append("AND spmc = ? ");
            params.add(parts.spmc);
        }
        if (parts.spmd != null) {
            sql.append("AND spmd = ? ");
            params.add(parts.spmd);
        }
    }

    private LocalDateTime toDateTime(long epochMillis) {
        return Instant.ofEpochMilli(epochMillis).atZone(ZoneOffset.UTC).toLocalDateTime();
    }

    private <T> List<T> executeQuery(String sql, List<Object> params,
                                      ThrowingFunction<ResultSet, T> mapper) {
        List<T> results = new ArrayList<>();
        try (Connection conn = getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    results.add(mapper.apply(rs));
                }
            }
        } catch (Exception e) {
            log.error("ClickHouse query failed: {}", e.getMessage(), e);
        }
        return results;
    }

    @FunctionalInterface
    private interface ThrowingFunction<T, R> {
        R apply(T t) throws SQLException;
    }

    // ---- data classes ----

    public static class SpmAggRow {
        public String spma, spmb, spmc, spmd;
        public String eventType;
        public long pv, uv;
    }

    public static class EventListResult {
        public final long total;
        public final List<Map<String, Object>> events;

        public EventListResult(long total, List<Map<String, Object>> events) {
            this.total = total;
            this.events = events;
        }
    }

    /**
     * SPM 码解析。格式: a_{app}.b_{page}.c_{section}.d_{point}
     */
    public static class SpmParts {
        public final String spma, spmb, spmc, spmd;

        private SpmParts(String spma, String spmb, String spmc, String spmd) {
            this.spma = spma;
            this.spmb = spmb;
            this.spmc = spmc;
            this.spmd = spmd;
        }

        public static SpmParts parse(String spmCode) {
            if (spmCode == null || spmCode.isEmpty()) return new SpmParts(null, null, null, null);
            String[] parts = spmCode.split("\\.");
            String spma = null, spmb = null, spmc = null, spmd = null;
            for (String part : parts) {
                if (part.startsWith("a_")) spma = part;
                else if (part.startsWith("b_")) spmb = part;
                else if (part.startsWith("c_")) spmc = part;
                else if (part.startsWith("d_")) spmd = part;
            }
            return new SpmParts(spma, spmb, spmc, spmd);
        }

        /** 重建完整 SPM code */
        public String toSpmCode() {
            return Arrays.stream(new String[]{spma, spmb, spmc, spmd})
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining("."));
        }
    }
}
