package com.gateflow.tracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.gateflow.tracker.config.TrackerProperties;

@SpringBootApplication(scanBasePackages = "com.gateflow.tracker")
@EnableScheduling
@EnableConfigurationProperties(TrackerProperties.class)
public class TrackerServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrackerServiceApplication.class, args);
    }
}
