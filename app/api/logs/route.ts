import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;

    if (role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only Super Admin can access logs." }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        admin: {
          select: {
            name: true,
            nip: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to 100 recent logs for performance
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
