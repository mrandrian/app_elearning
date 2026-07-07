import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    // Redirect non-admins to student dashboard
    redirect("/");
  }

  return <>{children}</>;
}
