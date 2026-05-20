package com.gateflow.tracker.controller;

import com.gateflow.tracker.domain.dto.ApiResponse;
import com.gateflow.tracker.domain.entity.TrackerEventRaw;
import com.gateflow.tracker.repository.TrackerEventRawMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Collector API", description = "SDK数据收集接口")
@RestController
@RequestMapping("/api/v1/collect")
@RequiredArgsConstructor
@Slf4j
public class CollectorController {

    private final TrackerEventRawMapper eventMapper;

    /**
     * 批量接收 SDK 上报的事件数据
     * SDK 发送格式: { events: [...] }
     */
    @PostMapping
    @Operation(summary = "批量接收事件")
    public ResponseEntity<ApiResponse<String>> collectEvents(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> events = (List<Map<String, Object>>) request.get("events");
        if (events == null) {
            events = List.of();
        }
        log.info("[Collector] Received {} events", events.size());

        int saved = 0;
        for (Map<String, Object> eventData : events) {
            try {
                saveEvent(eventData);
                saved++;
            } catch (Exception e) {
                log.error("[Collector] Failed to save event: {}", e.getMessage());
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Received " + saved + " events"));
    }

    /**
     * 单个事件接收（用于高优先级事件如曝光、点击）
     */
    @PostMapping("/single")
    @Operation(summary = "接收单个事件")
    public ResponseEntity<ApiResponse<String>> collectSingleEvent(@RequestBody Map<String, Object> eventData) {
        log.info("[Collector] Received single event: {}", eventData.get("eventType"));

        try {
            saveEvent(eventData);
            return ResponseEntity.ok(ApiResponse.success("Event saved"));
        } catch (Exception e) {
            log.error("[Collector] Failed to save event: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error(500, "Failed to save event"));
        }
    }

    private void saveEvent(Map<String, Object> eventData) {
        TrackerEventRaw event = new TrackerEventRaw();

        // 基本信息
        event.setEventId((String) eventData.get("eventId"));
        event.setEventType((String) eventData.get("eventType"));
        event.setAnonymousId((String) eventData.get("anonymousId"));
        event.setUserId((String) eventData.get("userId"));
        event.setAppId((String) eventData.get("appVersion"));
        event.setPlatform((String) eventData.get("platform"));
        event.setSdkVersion((String) eventData.get("sdkVersion"));

        // 时间
        Object timestamp = eventData.get("timestamp");
        if (timestamp instanceof Number) {
            event.setTimestamp(((Number) timestamp).longValue());
        }
        Object clientTime = eventData.get("clientTime");
        if (clientTime instanceof Number) {
            event.setClientTime(((Number) clientTime).longValue());
        }

        // 页面信息
        @SuppressWarnings("unchecked")
        Map<String, Object> page = (Map<String, Object>) eventData.get("page");
        if (page != null) {
            event.setPageUrl((String) page.get("url"));
            event.setPageTitle((String) page.get("title"));
            event.setPageReferrer((String) page.get("referrer"));
        }

        // 会话信息
        @SuppressWarnings("unchecked")
        Map<String, Object> session = (Map<String, Object>) eventData.get("session");
        if (session != null) {
            event.setSessionId((String) session.get("sessionId"));
            Object startTime = session.get("startTime");
            if (startTime instanceof Number) {
                event.setSessionStartTime(((Number) startTime).longValue());
            }
        }

        // 设备信息
        @SuppressWarnings("unchecked")
        Map<String, Object> device = (Map<String, Object>) eventData.get("device");
        if (device != null) {
            Object screenWidth = device.get("screenWidth");
            if (screenWidth instanceof Number) {
                event.setScreenWidth(((Number) screenWidth).intValue());
            }
            Object screenHeight = device.get("screenHeight");
            if (screenHeight instanceof Number) {
                event.setScreenHeight(((Number) screenHeight).intValue());
            }
            event.setUserAgent((String) device.get("userAgent"));
            event.setLanguage((String) device.get("language"));
        }

        // SPM 信息
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) eventData.get("data");
        if (data != null) {
            event.setSpmCode((String) data.get("spmCode"));
            Object spmLevel = data.get("spmLevel");
            if (spmLevel instanceof Number) {
                event.setSpmLevel(((Number) spmLevel).intValue());
            }
            event.setElementId((String) data.get("elementId"));
            event.setElementType((String) data.get("elementType"));
            event.setElementText((String) data.get("elementText"));
            Object clickX = data.get("clickX");
            if (clickX instanceof Number) {
                event.setClickX(((Number) clickX).intValue());
            }
            Object clickY = data.get("clickY");
            if (clickY instanceof Number) {
                event.setClickY(((Number) clickY).intValue());
            }
            Object exposureRatio = data.get("exposureRatio");
            if (exposureRatio instanceof Number) {
                event.setExposureRatio(((Number) exposureRatio).doubleValue());
            }
            Object exposureDuration = data.get("exposureDuration");
            if (exposureDuration instanceof Number) {
                event.setExposureDuration(((Number) exposureDuration).intValue());
            }
        }

        // UTM 参数
        @SuppressWarnings("unchecked")
        Map<String, Object> context = (Map<String, Object>) eventData.get("context");
        if (context != null) {
            event.setUtmSource((String) context.get("utmSource"));
            event.setUtmMedium((String) context.get("utmMedium"));
            event.setUtmCampaign((String) context.get("utmCampaign"));
            event.setUtmTerm((String) context.get("utmTerm"));
            event.setUtmContent((String) context.get("utmContent"));
        }

        // 存储原始数据
        event.setRawData(eventData.toString());

        eventMapper.insert(event);
    }
}