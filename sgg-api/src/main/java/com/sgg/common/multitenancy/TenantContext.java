package com.sgg.common.multitenancy;

public class TenantContext {

    private static final ThreadLocal<Long> currentGymId = new ThreadLocal<>();

    public static void setGymId(Long gymId) {
        currentGymId.set(gymId);
    }

    public static Long getGymId() {
        return currentGymId.get();
    }

    public static void clear() {
        currentGymId.remove();
    }

    private TenantContext() {
    }
}
