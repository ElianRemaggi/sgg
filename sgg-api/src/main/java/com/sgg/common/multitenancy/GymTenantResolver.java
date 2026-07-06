package com.sgg.common.multitenancy;

import java.util.Optional;

/**
 * Puerto implementado en com.sgg.tenancy — mantiene a common como módulo hoja,
 * sin depender de entidades ni repositorios de tenancy.
 */
public interface GymTenantResolver {

    Optional<GymTenantInfo> findGym(Long gymId);

    Optional<String> findActiveMemberRole(Long gymId, Long userId);
}
