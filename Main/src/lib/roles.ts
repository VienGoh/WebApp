import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export type AppRole = "ADMIN" | "PENELITI";

export async function requireRole(allowed: AppRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!allowed.includes(session.user.role as AppRole)) {
    redirect("/dashboard?denied=role");
  }
  return session.user;
}
