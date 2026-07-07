import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint to create a Course from an external application
// Requires Header: x-api-key: your-secret-key
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const validKey = process.env.EXTERNAL_API_KEY;
    
    // Default to true in dev if not set, but enforce in prod. For safety, we always enforce it here.
    // Make sure to add EXTERNAL_API_KEY to your .env file
    if (!validKey || apiKey !== validKey) {
      return NextResponse.json({ error: "Unauthorized. Invalid or missing API Key." }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, teacherNip, categoryId, thumbnail, published, hasCertificate } = body;

    if (!title || !teacherNip) {
      return NextResponse.json({ error: "Missing required fields: title, teacherNip" }, { status: 400 });
    }

    // Verify teacher exists
    const teacher = await prisma.user.findUnique({ where: { nip: teacherNip } });
    if (!teacher || (teacher.role !== "ADMIN" && teacher.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Invalid teacherNip or user is not an instructor" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        thumbnail: thumbnail || null,
        categoryId: categoryId || null,
        teacherNip,
        published: published || false,
        hasCertificate: hasCertificate || false
      }
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    console.error("External create course error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
