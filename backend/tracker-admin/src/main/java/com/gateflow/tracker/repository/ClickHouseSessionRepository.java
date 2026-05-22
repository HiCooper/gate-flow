package com.gateflow.tracker.repository;

import com.gateflow.tracker.config.ClickHouseProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ClickHouse Session 分析查询 Repository。
 * 直接查询 gateflow_tracker.sessions 表。
 */
@Repository
@Slf4j
public class ClickHouseSessionRepository {

    private final ClickHouseProperties clickHouseProperties;
    private volatile DataSource dataSource;

    public ClickHouseSessionRepository(ClickHouseProperties clickHouseProperties) {
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
     * 按天聚合 Session 统计。
     * SELECT toDate(start_time) as date, platform,
     *        count() as session_count, uniq(user_id) as user_count,
     *        avg(duration) as avg_duration, avg(page_views) as avg_page_depth,
     *        sum(is_bounce) as bounce_count
     * FROM gateflow_tracker.sessions
     * WHERE ... GROUP BY date, platform ORDER BY date DESC
     */
    public List<SessionAggRow> queryDailyAgg(LocalDate startDate, LocalDate endDate, String platform) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT toDate(start_time) AS date, platform, ");
        sql.append("count() AS session_count, uniq(user_id) AS user_count, ");
        sql.append("avg(duration) AS avg_duration, avg(page_views) AS avg_page_depth, ");
        sql.append("sum(is_bounce) AS bounce_count ");
        sql.append("FROM gateflow_tracker.sessions ");
        sql.append("WHERE start_time >= ? AND start_time < ? ");

        List<Object> params = new ArrayList<>();
        params.add(toDateTime(startDate));
        params.add(toDateTime(endDate.plusDays(1)));

        if (platform != null && !platform.isEmpty()) {
            sql.append("AND platform = ? ");
            params.add(platform);
        }

        sql.append("GROUP BY date, platform ");
        sql.append("ORDER BY date DESC ");
        sql.append("LIMIT 1000");

        return executeQuery(sql.toString(), params, rs -> {
            SessionAggRow row = new SessionAggRow();
            row.date = rs.getDate("date").toLocalDate();
            row.platform = rs.getString("platform");
            row.sessionCount = rs.getLong("session_count");
            row.userCount = rs.getLong("user_count");
            row.avgDuration = rs.getBigDecimal("avg_duration");
            row.avgPageDepth = rs.getBigDecimal("avg_page_depth");
            row.bounceCount = rs.getLong("bounce_count");
            return row;
        });
    }

    /**
     * 按小时聚合 Session 统计。
     */
    public List<SessionAggRow> queryHourlyAgg(LocalDate startDate, LocalDate endDate, String platform) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT toStartOfHour(start_time) AS hour, platform, ");
        sql.append("count() AS session_count, uniq(user_id) AS user_count, ");
        sql.append("avg(duration) AS avg_duration, avg(page_views) AS avg_page_depth, ");
        sql.append("sum(is_bounce) AS bounce_count ");
        sql.append("FROM gateflow_tracker.sessions ");
        sql.append("WHERE start_time >= ? AND start_time < ? ");

        List<Object> params = new ArrayList<>();
        params.add(toDateTime(startDate));
        params.add(toDateTime(endDate.plusDays(1)));

        if (platform != null && !platform.isEmpty()) {
            sql.append("AND platform = ? ");
            params.add(platform);
        }

        sql.append("GROUP BY hour, platform ");
        sql.append("ORDER BY hour DESC ");
        sql.append("LIMIT 10000");

        return executeQuery(sql.toString(), params, rs -> {
            SessionAggRow row = new SessionAggRow();
            row.hour = rs.getTimestamp("hour").toLocalDateTime();
            row.platform = rs.getString("platform");
            row.sessionCount = rs.getLong("session_count");
            row.userCount = rs.getLong("user_count");
            row.avgDuration = rs.getBigDecimal("avg_duration");
            row.avgPageDepth = rs.getBigDecimal("avg_page_depth");
            row.bounceCount = rs.getLong("bounce_count");
            return row;
        });
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
            log.error("ClickHouse session query failed: {}", e.getMessage(), e);
        }
        return results;
    }

    @FunctionalInterface
    private interface ThrowingFunction<T, R> {
        R apply(T t) throws SQLException;
    }

    // ---- data class ----

    public static class SessionAggRow {
        public LocalDateTime hour;
        public LocalDate date;
        public String platform;
        public long sessionCount;
        public long userCount;
        public java.math.BigDecimal avgDuration;
        public java.math.BigDecimal avgPageDepth;
        public long bounceCount;
    }
}
