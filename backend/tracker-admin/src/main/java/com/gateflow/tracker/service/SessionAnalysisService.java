package com.gateflow.tracker.service;

import com.gateflow.tracker.domain.dto.SessionAnalysisVO;
import com.gateflow.tracker.repository.ClickHouseSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionAnalysisService {

    private final ClickHouseSessionRepository sessionRepository;

    public List<SessionAnalysisVO> query(String sessionId, String userId,
                                          LocalDate startDate, LocalDate endDate) {
        List<ClickHouseSessionRepository.SessionAggRow> rows = sessionRepository.queryHourlyAgg(
                startDate != null ? startDate : LocalDate.now().minusDays(7),
                endDate != null ? endDate : LocalDate.now(),
                null);

        return rows.stream().map(this::toVO).collect(Collectors.toList());
    }

    public List<SessionAnalysisVO> getRecentData(int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        List<ClickHouseSessionRepository.SessionAggRow> rows = sessionRepository.queryDailyAgg(
                startDate, endDate, null);

        return rows.stream().map(this::toVO).collect(Collectors.toList());
    }

    private SessionAnalysisVO toVO(ClickHouseSessionRepository.SessionAggRow row) {
        SessionAnalysisVO vo = new SessionAnalysisVO();
        if (row.hour != null) {
            vo.setDate(row.hour.toLocalDate());
            vo.setHour(row.hour.getHour());
        } else if (row.date != null) {
            vo.setDate(row.date);
        }
        vo.setPlatform(row.platform);
        vo.setSessionCount(row.sessionCount);
        vo.setUserCount(row.userCount);
        vo.setAvgDuration(row.avgDuration);
        vo.setAvgPageDepth(row.avgPageDepth);

        long bounceCount = row.bounceCount;
        long sessionCount = row.sessionCount;
        vo.setBounceCount(bounceCount);

        if (sessionCount > 0) {
            BigDecimal rate = BigDecimal.valueOf(bounceCount)
                    .divide(BigDecimal.valueOf(sessionCount), 4, RoundingMode.HALF_UP);
            vo.setBounceRate(rate);
        } else {
            vo.setBounceRate(BigDecimal.ZERO);
        }
        return vo;
    }
}
