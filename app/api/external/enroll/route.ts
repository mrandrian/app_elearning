import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint to enroll a user into a course from an external application
// Requires Header: x-api-key: your-secret-key
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const validKey = process.env.EXTERNAL_API_KEY;
    
    // Make sure to add EXTERNAL_API_KEY to your .env file
    if (!validKey || apiKey !== validKey) {
      return NextResponse.json({ error: "Unauthorized. Invalid or missing API Key." }, { status: 401 });
    }

    const body = await req.json();
    const { nip, courseId } = body;

    if (!nip || !courseId) {
      return NextResponse.json({ error: "Missing required fields: nip, courseId" }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { nip }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userNip_courseId: {
          userNip: nip,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ message: "Already enrolled", enrollment: existingEnrollment }, { status: 200 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userNip: nip,
        courseId
      }
    });

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error: any) {
    console.error("External enroll error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
