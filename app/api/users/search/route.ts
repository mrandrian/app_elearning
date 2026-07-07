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
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(q ? {
          OR: [
            { name: { contains: q } },
            { nip: { contains: q } }
          ]
        } : {})
      },
      select: {
        nip: true,
        name: true,
        email: true
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to search users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
