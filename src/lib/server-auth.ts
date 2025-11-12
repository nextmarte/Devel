import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Get current session on server-side
 * Usage: const session = await getServerAuth();
 */
export async function getServerAuth() {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Get current session and redirect to login if not authenticated
 * Usage: const session = await requireServerAuth();
 */
export async function requireServerAuth() {
  const session = await getServerAuth();
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  return session;
}

/**
 * Check if user is admin, redirect if not
 * Usage: const session = await requireAdminAuth();
 */
export async function requireAdminAuth() {
  const session = await requireServerAuth();
  
  if (session.user.role !== "admin") {
    redirect("/auth/error?error=AccessDenied");
  }
  
  return session;
}

/**
 * Check if user has premium subscription
 */
export async function requirePremiumAuth() {
  const session = await requireServerAuth();
  
  const premiumPlans = ["pro", "enterprise"];
  if (!premiumPlans.includes(session.user.subscriptionPlan)) {
    redirect("/pricing");
  }
  
  return session;
}
