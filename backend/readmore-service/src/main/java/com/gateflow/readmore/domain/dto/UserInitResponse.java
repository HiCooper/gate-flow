package com.gateflow.readmore.domain.dto;

import com.gateflow.victor.sdk.model.SdkExperimentTag;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UserInitResponse {
    private String userId;
    private Map<String, String> variants;
    private List<SdkExperimentTag> experimentTags;
}
