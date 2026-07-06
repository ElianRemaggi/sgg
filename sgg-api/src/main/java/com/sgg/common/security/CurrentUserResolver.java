package com.sgg.common.security;

import java.util.Optional;

/**
 * Puerto implementado en com.sgg.identity — mantiene a common como módulo hoja,
 * sin depender de la entidad User ni de UserRepository.
 */
public interface CurrentUserResolver {

    Optional<ResolvedUser> resolve(String subject, boolean nativeToken);
}
