package com.sgg.identity.security;

import com.sgg.common.security.CurrentUserResolver;
import com.sgg.common.security.ResolvedUser;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CurrentUserResolverImpl implements CurrentUserResolver {

    private final UserRepository userRepository;

    @Override
    public Optional<ResolvedUser> resolve(String subject, boolean nativeToken) {
        Optional<User> userOpt = nativeToken
            ? userRepository.findById(Long.valueOf(subject)).filter(u -> u.getDeletedAt() == null)
            : userRepository.findBySupabaseUidAndDeletedAtIsNull(subject);

        return userOpt.map(u -> new ResolvedUser(u.getId(), u.getPlatformRole()));
    }
}
