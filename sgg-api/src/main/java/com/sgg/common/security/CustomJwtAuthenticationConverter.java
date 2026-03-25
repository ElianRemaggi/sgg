package com.sgg.common.security;

import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserRepository userRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        String subject = jwt.getSubject();
        Optional<User> userOpt;

        if (isNativeToken(jwt)) {
            userOpt = userRepository.findById(Long.valueOf(subject));
        } else {
            userOpt = userRepository.findBySupabaseUid(subject);
        }

        userOpt.ifPresent(user -> {
            if ("SUPERADMIN".equals(user.getPlatformRole())) {
                authorities.add(new SimpleGrantedAuthority("ROLE_SUPERADMIN"));
            }
        });

        return new JwtAuthenticationToken(jwt, authorities, subject);
    }

    static boolean isNativeToken(Jwt jwt) {
        return "sgg".equals(jwt.getClaimAsString("iss"));
    }
}
