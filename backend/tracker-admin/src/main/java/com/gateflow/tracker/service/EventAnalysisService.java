package com.gateflow.tracker.service;

import com.gateflow.tracker.domain.dto.EventAnalysisQueryRequest;
import com.gateflow.tracker.domain.dto.EventAnalysisVO;
import com.gateflow.tracker.repository.ClickHouseEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventAnalysisService {

    private final ClickHouseEventRepository eventRepository;

    public List<EventAnalysisVO> query(EventAnalysisQueryRequest request) {
        List<ClickHouseEventRepository.EventAggRow> rows = eventRepository.queryHourlyAgg(
                request.getStartDate(), request.getEndDate(),
                request.getEventKey(), request.getPlatform());

        return rows.stream().map(this::toVO).collect(Collectors.toList());
    }

    public List<EventAnalysisVO> getRecentData(int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        List<ClickHouseEventRepository.EventAggRow> rows = eventRepository.queryDailyAgg(
                startDate, endDate, null);

        return rows.stream().map(this::toVO).collect(Collectors.toList());
    }

    private EventAnalysisVO toVO(ClickHouseEventRepository.EventAggRow row) {
        EventAnalysisVO vo = new EventAnalysisVO();
        if (row.hour != null) {
            vo.setDate(row.hour.toLocalDate());
            vo.setHour(row.hour.getHour());
        } else if (row.date != null) {
            vo.setDate(row.date);
        }
        vo.setPlatform(row.platform);
        vo.setEventType(row.eventType);
        vo.setEventCount(row.eventCount);
        vo.setUserCount(row.userCount);
        vo.setDeviceCount(row.deviceCount);
        return vo;
    }
}
