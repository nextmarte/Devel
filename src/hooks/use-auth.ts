import { useSession } from "next-auth/react";
import { useCallback } from "react";

interface Permission {
  resource: string;
  action: string;
}

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    { resource: "users", action: "manage" },
    { resource: "plans", action: "manage" },
    { resource: "billing", action: "manage" },
    { resource: "dashboard", action: "view" },
    { resource: "transcriptions", action: "manage" },
  ],
  enterprise: [
    { resource: "transcriptions", action: "unlimited" },
    { resource: "dashboard", action: "view" },
    { resource: "team", action: "manage" },
    { resource: "billing", action: "view" },
  ],
  pro: [
    { resource: "transcriptions", action: "limited" },
    { resource: "dashboard", action: "view" },
    { resource: "billing", action: "view" },
  ],
  starter: [
    { resource: "transcriptions", action: "limited" },
    { resource: "dashboard", action: "view" },
  ],
  trial: [
    { resource: "transcriptions", action: "trial" },
    { resource: "dashboard", action: "view" },
  ],
  free: [
    { resource: "transcriptions", action: "basic" },
  ],
};

export function useAuth() {
  const { data: session, status } = useSession();

  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (!session?.user) return false;

      const userRole = session.user.role || "free";
      const permissions = rolePermissions[userRole] || [];

      return permissions.some(
        (p) => p.resource === resource && p.action === action
      );
    },
    [session]
  );

  const hasAnyPermission = useCallback(
    (checks: { resource: string; action: string }[]): boolean => {
      return checks.some(({ resource, action }) =>
        hasPermission(resource, action)
      );
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (checks: { resource: string; action: string }[]): boolean => {
      return checks.every(({ resource, action }) =>
        hasPermission(resource, action)
      );
    },
    [hasPermission]
  );

  const isAdmin = useCallback(() => {
    return session?.user?.role === "admin";
  }, [session]);

  const isAuthenticated = useCallback(() => {
    return status === "authenticated" && !!session?.user;
  }, [status, session]);

  const isPremium = useCallback(() => {
    const plan = session?.user?.subscriptionPlan;
    return plan && !["free", "trial"].includes(plan);
  }, [session]);

  return {
    session,
    status,
    user: session?.user,
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    isPremium: isPremium(),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
