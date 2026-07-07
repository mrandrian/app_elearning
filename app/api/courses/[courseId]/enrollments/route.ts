import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { nip } = body;

    if (!nip) {
      return NextResponse.json({ error: "NIP wajib diisi" }, { status: 400 });
    }

    const userToEnroll = await prisma.user.findUnique({
      where: { nip }
    });

    if (!userToEnroll) {
      return NextResponse.json({ error: "User dengan NIP tersebut tidak ditemukan" }, { status: 404 });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userNip_courseId: {
          userNip: nip,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: "Peserta sudah terdaftar di kursus ini" }, { status: 400 });
    }

    const newEnrollment = await prisma.enrollment.create({
      data: {
        userNip: nip,
        courseId
      }
    });

    return NextResponse.json({ success: true, enrollment: newEnrollment });
  } catch (error: any) {
    console.error("Internal enroll error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
