package com.gateflow.readmore.service;

import com.gateflow.readmore.domain.dto.ReadingRecordRequest;
import com.gateflow.readmore.domain.entity.UserReadingRecord;
import com.gateflow.readmore.mapper.UserReadingRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReadingService {

    private final UserReadingRecordMapper readingRecordMapper;

    public void recordProgress(ReadingRecordRequest request) {
        UserReadingRecord record = new UserReadingRecord();
        record.setUserId(request.getUserId());
        record.setBookId(request.getBookId());
        record.setChapterId(request.getChapterId());
        record.setReadProgress(request.getReadProgress());
        record.setLastReadAt(LocalDateTime.now());
        readingRecordMapper.insert(record);
    }
}
