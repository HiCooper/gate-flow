package com.gateflow.tracker.repository;

import com.gateflow.tracker.config.ClickHouseProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ClickHouse 事件分析查询 Repository。
 * 直接查询 gateflow_tracker.events 表，利用 ClickHouse 列存引擎的向量化聚合能力。
 */
@Repository
@Slf4j
public class ClickHouseEventRepository {

    private final ClickHouseProperties clickHouseProperties;
    private volatile DataSource dataSource;

    public ClickHouseEventRepository(ClickHouseProperties clickHouseProperties) {
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
     * 按小时聚合事件统计。
     * SELECT toStartOfHour(timestamp) as hour, platform, event_type,
     *        count() as event_count, uniq(user_id) as user_count, uniq(anonymous_id) as device_count
     * FROM gateflow_tracker.events
     * WHERE ... GROUP BY hour, platform, event_type ORDER BY hour DESC
     */
    public List<EventAggRow> queryHourlyAgg(LocalDate startDate, LocalDate endDate,
                                             String eventType, String platform) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT toStartOfHour(timestamp) AS hour, platform, event_type, ");
        sql.append("count() AS event_count, uniq(user_id) AS user_count, uniq(anonymous_id) AS device_count ");
        sql.append("FROM gateflow_tracker.events ");
        sql.append("WHERE 1=1 ");

        List<Object> params = new ArrayList<>();

        if (startDate != null) {
            sql.append("AND timestamp >= ? ");
            params.add(toDateTime(startDate));
        }
        if (endDate != null) {
            sql.append("AND timestamp < ? ");
            params.add(toDateTime(endDate.plusDays(1)));
        }
        if (eventType != null && !eventType.isEmpty()) {
            sql.append("AND event_type = ? ");
            params.add(eventType);
        }
        if (platform != null && !platform.isEmpty()) {
            sql.append("AND platform = ? ");
            params.add(platform);
        }

        sql.append("GROUP BY hour, platform, event_type ");
        sql.append("ORDER BY hour DESC ");
        sql.append("LIMIT 10000");

        return executeQuery(sql.toString(), params, rs -> {
            EventAggRow row = new EventAggRow();
            row.hour = rs.getTimestamp("hour").toLocalDateTime();
            row.platform = rs.getString("platform");
            row.eventType = rs.getString("event_type");
            row.eventCount = rs.getLong("event_count");
            row.userCount = rs.getLong("user_count");
            row.deviceCount = rs.getLong("device_count");
            return row;
        });
    }

    /**
     * 按天聚合事件统计（最近 N 天看板用）。
     * SELECT toDate(timestamp) as date, event_type,
     *        count() as event_count, uniq(user_id) as user_count, uniq(anonymous_id) as device_count
     * FROM gateflow_tracker.events
     * WHERE timestamp >= ? GROUP BY date, event_type ORDER BY date DESC
     */
    public List<EventAggRow> queryDailyAgg(LocalDate startDate, LocalDate endDate, String eventType) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT toDate(timestamp) AS date, event_type, ");
        sql.append("count() AS event_count, uniq(user_id) AS user_count, uniq(anonymous_id) AS device_count ");
        sql.append("FROM gateflow_tracker.events ");
        sql.append("WHERE timestamp >= ? AND timestamp < ? ");

        List<Object> params = new ArrayList<>();
        params.add(toDateTime(startDate));
        params.add(toDateTime(endDate.plusDays(1)));

        if (eventType != null && !eventType.isEmpty()) {
            sql.append("AND event_type = ? ");
            params.add(eventType);
        }

        sql.append("GROUP BY date, event_type ");
        sql.append("ORDER BY date DESC ");
        sql.append("LIMIT 1000");

        return executeQuery(sql.toString(), params, rs -> {
            EventAggRow row = new EventAggRow();
            row.date = rs.getDate("date").toLocalDate();
            row.eventType = rs.getString("event_type");
            row.eventCount = rs.getLong("event_count");
            row.userCount = rs.getLong("user_count");
            row.deviceCount = rs.getLong("device_count");
            return row;
        });
    }

    /**
     * 事件明细分页查询。
     */
    public EventListResult queryEventList(String eventType, String platform,
                                           LocalDate startDate, LocalDate endDate,
                                           int offset, int limit) {
        StringBuilder countSql = new StringBuilder();
        countSql.append("SELECT count() AS cnt FROM gateflow_tracker.events WHERE 1=1 ");

        StringBuilder dataSql = new StringBuilder();
        dataSql.append("SELECT event_id, event_type, user_id, anonymous_id, session_id, ");
        dataSql.append("timestamp, platform, page_url, page_title, page_referrer, ");
        dataSql.append("spma, spmb, spmc, spmd, ");
        dataSql.append("device_type, os, browser, ");
        dataSql.append("element_id, element_type, element_text, click_x, click_y, ");
        dataSql.append("utm_source, utm_medium, utm_campaign ");
        dataSql.append("FROM gateflow_tracker.events WHERE 1=1 ");

        List<Object> countParams = new ArrayList<>();
        List<Object> dataParams = new ArrayList<>();

        appendWhere(countSql, countParams, eventType, platform, startDate, endDate);
        appendWhere(dataSql, dataParams, eventType, platform, startDate, endDate);

        dataSql.append("ORDER BY timestamp DESC LIMIT ? OFFSET ?");
        dataParams.add(limit);
        dataParams.add(offset);

        long total = executeQuery(countSql.toString(), countParams,
                rs -> rs.getLong(1)).stream().findFirst().orElse(0L);

        List<Map<String, Object>> events = executeQuery(dataSql.toString(), dataParams, rs -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("eventId", rs.getString("event_id"));
            map.put("eventType", rs.getString("event_type"));
            map.put("userId", rs.getString("user_id"));
            map.put("anonymousId", rs.getString("anonymous_id"));
            map.put("sessionId", rs.getString("session_id"));
            Timestamp ts = rs.getTimestamp("timestamp");
            map.put("timestamp", ts != null ? ts.getTime() : null);
            map.put("platform", rs.getString("platform"));
            map.put("pageUrl", rs.getString("page_url"));
            map.put("pageTitle", rs.getString("page_title"));
            map.put("pageReferrer", rs.getString("page_referrer"));
            map.put("spma", rs.getString("spma"));
            map.put("spmb", rs.getString("spmb"));
            map.put("spmc", rs.getString("spmc"));
            map.put("spmd", rs.getString("spmd"));
            map.put("deviceType", rs.getString("device_type"));
            map.put("os", rs.getString("os"));
            map.put("browser", rs.getString("browser"));
            map.put("elementId", rs.getString("element_id"));
            map.put("elementType", rs.getString("element_type"));
            map.put("elementText", rs.getString("element_text"));
            map.put("clickX", rs.getObject("click_x"));
            map.put("clickY", rs.getObject("click_y"));
            map.put("utmSource", rs.getString("utm_source"));
            map.put("utmMedium", rs.getString("utm_medium"));
            map.put("utmCampaign", rs.getString("utm_campaign"));
            return map;
        });

        return new EventListResult(total, events);
    }

    private void appendWhere(StringBuilder sql, List<Object> params,
                              String eventType, String platform,
                              LocalDate startDate, LocalDate endDate) {
        if (eventType != null && !eventType.isEmpty()) {
            sql.append("AND event_type = ? ");
            params.add(eventType);
        }
        if (platform != null && !platform.isEmpty()) {
            sql.append("AND platform = ? ");
            params.add(platform);
        }
        if (startDate != null) {
            sql.append("AND timestamp >= ? ");
            params.add(toDateTime(startDate));
        }
        if (endDate != null) {
            sql.append("AND timestamp < ? ");
            params.add(toDateTime(endDate.plusDays(1)));
        }
    }

    private LocalDateTime toDateTime(LocalDate date) {
        return date.atStartOfDay();
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
            log.error("ClickHouse event query failed: {}", e.getMessage(), e);
        }
        return results;
    }

    @FunctionalInterface
    private interface ThrowingFunction<T, R> {
        R apply(T t) throws SQLException;
    }

    // ---- data classes ----

    public static class EventAggRow {
        public LocalDateTime hour;
        public LocalDate date;
        public String platform;
        public String eventType;
        public long eventCount;
        public long userCount;
        public long deviceCount;
    }

    public static class EventListResult {
        public final long total;
        public final List<Map<String, Object>> events;

        public EventListResult(long total, List<Map<String, Object>> events) {
            this.total = total;
            this.events = events;
        }
    }
}
