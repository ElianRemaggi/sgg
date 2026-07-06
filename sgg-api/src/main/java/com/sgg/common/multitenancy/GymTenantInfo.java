package com.sgg.common.multitenancy;

public record GymTenantInfo(Long gymId, Long ownerUserId, String type) {
}
