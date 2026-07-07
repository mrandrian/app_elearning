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

    const nip = (session.user as any).id;

    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        userNip: nip,
        completed: true,
        course: {
          hasCertificate: true
        }
      },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            thumbnail: true,
            certificateBg: true,
            certificateTemplate: true,
            category: { select: { name: true } }
          }
        },
        user: { select: { name: true } }
      },
      orderBy: { id: "desc" } // Ideally there would be an updated_at to track completion date, but ID works
    });

    return NextResponse.json({ certificates: completedEnrollments });
  } catch (error) {
    console.error("Failed to fetch certificates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
