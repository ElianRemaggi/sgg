package com.sgg.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // TenantInterceptor se registra en Fase 2 cuando se implemente el módulo tenancy
}
