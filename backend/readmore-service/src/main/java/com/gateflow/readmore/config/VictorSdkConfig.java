package com.gateflow.readmore.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "readmore.victor")
@Data
public class VictorSdkConfig {
    private String serverUrl = "http://localhost:8081";
    private String platform = "readmore";
    private int pollingInterval = 30;
    private int requestTimeout = 5000;
    private int retryCount = 3;
    private boolean eventTrackingEnabled = true;
    private String gateflowEventUrl = "http://localhost:8081/api/v1/events";
}
