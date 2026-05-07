package com.gateflow.readmore.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gateflow.readmore.domain.dto.UserInitResponse;
import com.gateflow.readmore.domain.dto.UserProfileResponse;
import com.gateflow.readmore.domain.entity.Book;
import com.gateflow.readmore.domain.entity.Subscription;
import com.gateflow.readmore.domain.entity.UserReadingRecord;
import com.gateflow.readmore.mapper.BookMapper;
import com.gateflow.readmore.mapper.SubscriptionMapper;
import com.gateflow.readmore.mapper.UserReadingRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserReadingRecordMapper readingRecordMapper;
    private final SubscriptionMapper subscriptionMapper;
    private final BookMapper bookMapper;
    private final VictorSdkService victorSdkService;

    public UserInitResponse initUser(String userId) {
        UserInitResponse response = new UserInitResponse();
        response.setUserId(userId);
        response.setVariants(victorSdkService.getAllVariants(userId));
        response.setExperimentTags(victorSdkService.getExperimentTags(userId));
        return response;
    }

    public UserProfileResponse getProfile(String userId) {
        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(userId);
        response.setVariants(victorSdkService.getAllVariants(userId));

        LambdaQueryWrapper<UserReadingRecord> recordWrapper = new LambdaQueryWrapper<>();
        recordWrapper.eq(UserReadingRecord::getUserId, userId)
                .orderByDesc(UserReadingRecord::getLastReadAt)
                .last("LIMIT 20");
        List<UserReadingRecord> records = readingRecordMapper.selectList(recordWrapper);
        List<UserProfileResponse.UserReadingRecordDto> history = records.stream().map(r -> {
            UserProfileResponse.UserReadingRecordDto dto = new UserProfileResponse.UserReadingRecordDto();
            dto.setBookId(r.getBookId());
            Book book = bookMapper.selectById(r.getBookId());
            dto.setBookTitle(book != null ? book.getTitle() : null);
            dto.setChapterId(r.getChapterId());
            dto.setReadProgress(r.getReadProgress());
            dto.setLastReadAt(r.getLastReadAt() != null ? r.getLastReadAt().toString() : null);
            return dto;
        }).collect(Collectors.toList());
        response.setReadingHistory(history);

        LambdaQueryWrapper<Subscription> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(Subscription::getUserId, userId)
                .orderByDesc(Subscription::getEndDate)
                .last("LIMIT 1");
        Subscription sub = subscriptionMapper.selectOne(subWrapper);
        if (sub != null) {
            UserProfileResponse.SubscriptionDto subDto = new UserProfileResponse.SubscriptionDto();
            subDto.setPlanType(sub.getPlanType());
            subDto.setStartDate(sub.getStartDate() != null ? sub.getStartDate().toString() : null);
            subDto.setEndDate(sub.getEndDate() != null ? sub.getEndDate().toString() : null);
            subDto.setStatus(sub.getStatus());
            response.setSubscription(subDto);
        }

        return response;
    }
}
