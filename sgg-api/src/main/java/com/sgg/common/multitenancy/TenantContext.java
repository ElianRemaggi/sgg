package com.sgg.common.multitenancy;

public class TenantContext {

    private static final ThreadLocal<Long> currentGymId = new ThreadLocal<>();
    private static final ThreadLocal<String> currentMemberRole = new ThreadLocal<>();
    private static final ThreadLocal<String> currentGymType = new ThreadLocal<>();
    private static final ThreadLocal<Long> currentGymOwnerUserId = new ThreadLocal<>();

    public static void setGymId(Long gymId) {
        currentGymId.set(gymId);
    }

    public static Long getGymId() {
        return currentGymId.get();
    }

    public static void setCurrentMemberRole(String role) {
        currentMemberRole.set(role);
    }

    public static String getCurrentMemberRole() {
        return currentMemberRole.get();
    }

    public static void setGymType(String gymType) {
        currentGymType.set(gymType);
    }

    public static String getGymType() {
        return currentGymType.get();
    }

    public static void setGymOwnerUserId(Long ownerUserId) {
        currentGymOwnerUserId.set(ownerUserId);
    }

    public static Long getGymOwnerUserId() {
        return currentGymOwnerUserId.get();
    }

    public static void clear() {
        currentGymId.remove();
        currentMemberRole.remove();
        currentGymType.remove();
        currentGymOwnerUserId.remove();
    }

    private TenantContext() {
    }
}
