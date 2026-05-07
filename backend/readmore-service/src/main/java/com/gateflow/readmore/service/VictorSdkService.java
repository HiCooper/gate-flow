package com.gateflow.readmore.service;

import com.gateflow.readmore.config.VictorSdkConfig;
import com.gateflow.victor.sdk.VictorClient;
import com.gateflow.victor.sdk.VictorConfig;
import com.gateflow.victor.sdk.model.SdkExperimentTag;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VictorSdkService {

    private final VictorSdkConfig config;
    private VictorClient client;

    @PostConstruct
    public void init() {
        VictorConfig victorConfig = VictorConfig.builder()
                .serverUrl(config.getServerUrl())
                .platform(config.getPlatform())
                .pollingInterval(config.getPollingInterval())
                .requestTimeout(config.getRequestTimeout())
                .retryCount(config.getRetryCount())
                .eventTrackingEnabled(config.isEventTrackingEnabled())
                .build();
        this.client = VictorClient.init(victorConfig);
    }

    @PreDestroy
    public void shutdown() {
        if (client != null) {
            client.shutdown();
        }
    }

    public String getVariant(String userId, String experimentKey) {
        return client.getVariant(userId, experimentKey);
    }

    public <T> T getParam(String userId, String experimentKey, String paramKey, T defaultValue) {
        return client.getParam(userId, experimentKey, paramKey, defaultValue);
    }

    public Map<String, String> getAllVariants(String userId) {
        return client.getAllVariants(userId);
    }

    public List<SdkExperimentTag> getExperimentTags(String userId) {
        return client.getExperimentTags(userId);
    }

    public boolean isInitialized() {
        return client != null && client.isInitialized();
    }
}
