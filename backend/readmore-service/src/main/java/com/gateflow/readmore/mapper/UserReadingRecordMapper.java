package com.gateflow.readmore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gateflow.readmore.domain.entity.UserReadingRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserReadingRecordMapper extends BaseMapper<UserReadingRecord> {
}
