import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const nip = (session.user as any).id;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, title, type, contentPath, minPassingScore } = body;

    if (!courseId || !title || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate type against allowed enum values
    const validModuleTypes = ["H5P", "VIDEO", "DOCUMENT", "QUIZ", "LINK", "ASSIGNMENT", "CATEGORY", "GAMIFICATION", "GAME_FLASHCARD", "GAME_MATCHING", "GAME_BLANKS", "ARTICLE"];
    if (!validModuleTypes.includes(type)) {
      return NextResponse.json({ error: `Tipe modul '${type}' tidak valid` }, { status: 400 });
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get max order
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: "desc" }
    });
    
    const newOrder = lastModule ? lastModule.order + 1 : 1;

    const newModule = await prisma.module.create({
      data: {
        courseId,
        title,
        type,
        contentPath,
        order: newOrder,
        minPassingScore: minPassingScore !== undefined && minPassingScore !== null ? minPassingScore : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: nip,
        action: "CREATE_MODULE",
        entityType: "MODULE",
        entityId: newModule.id,
        details: `Buat modul baru\nJudul: ${title}\nTipe: ${type}\nKursus: ${course.title}`,
      }
    });

    return NextResponse.json({ success: true, module: newModule });
  } catch (error) {
    console.error("Failed to create module:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
