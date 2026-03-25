package com.sgg.common.security;

import com.sgg.common.config.NativeJwtConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Component
public class DualJwtDecoder implements JwtDecoder {

    private static final Logger log = LoggerFactory.getLogger(DualJwtDecoder.class);

    private final NimbusJwtDecoder nativeDecoder;
    private final NimbusJwtDecoder supabaseDecoder;

    public DualJwtDecoder(NativeJwtConfig nativeJwtConfig,
                          @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwksUri) {
        this.nativeDecoder = NimbusJwtDecoder.withSecretKey(nativeJwtConfig.getKey()).build();
        this.supabaseDecoder = NimbusJwtDecoder.withJwkSetUri(jwksUri).build();
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            return nativeDecoder.decode(token);
        } catch (JwtException e) {
            log.debug("Token no es nativo, intentando con Supabase");
        }
        return supabaseDecoder.decode(token);
    }
}
