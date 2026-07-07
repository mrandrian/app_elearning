import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userNip = (session?.user as any)?.id as string;

    if (!session || !userNip) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.published) {
      return NextResponse.json({ error: "Kursus belum dipublikasikan" }, { status: 403 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userNip_courseId: {
          userNip,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ message: "Already enrolled", enrollment: existingEnrollment });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userNip,
        courseId
      }
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
