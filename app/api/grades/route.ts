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
    const nip = (session.user as any).id;

    let scores;

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      scores = await prisma.score.findMany({
        include: {
          user: { select: { name: true, nip: true } },
          module: {
            select: {
              title: true,
              course: { select: { title: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });

    } else {
      scores = await prisma.score.findMany({
        where: { userNip: nip },
        include: {
          user: { select: { name: true, nip: true } },
          module: {
            select: {
              title: true,
              type: true,
              course: { select: { title: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ scores });
  } catch (error) {
    console.error("Failed to fetch grades:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
