package com.gateflow.readmore;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.gateflow.readmore.mapper")
public class ReadMoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReadMoreApplication.class, args);
    }
}
