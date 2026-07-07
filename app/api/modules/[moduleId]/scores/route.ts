import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawScores: any[] = await prisma.$queryRaw`
      SELECT s.*, u.name as "userName", u.nip as "userNipStr"
      FROM "Score" s
      JOIN "User" u ON s."userNip" = u.nip
      WHERE s."moduleId" = ${moduleId}
      ORDER BY s."createdAt" DESC
    `;

    const scores = rawScores.map(s => ({
      id: s.id,
      value: s.value,
      status: s.status,
      createdAt: s.createdAt,
      user: {
        name: s.userName,
        nip: s.userNipStr
      }
    }));

    return NextResponse.json({ scores });
  } catch (error: any) {
    console.error("Failed to fetch module scores:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
