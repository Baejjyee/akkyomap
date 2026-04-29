package com.akkyomap.backend.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("아껴맵 API")
                .description("대학생과 취준생을 위한 생활비 절약 지도 서비스 API 문서")
                .version("v1"));
    }
}
