import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateCourseSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  thumbnail: z.string().nullable().optional(),
  categoryId: z.string().min(1, "Kategori wajib diisi"),
  hasCertificate: z.boolean().optional(),
  certificateBg: z.string().nullable().optional(),
  certificateConfig: z.string().nullable().optional(),
  certificateTemplateId: z.string().nullable().optional(),
});

export async function GET(
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
    const nip = (session.user as any).id;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        modules: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { enrollments: true }
        }
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const completedCount = await prisma.enrollment.count({
      where: { courseId, completed: true }
    });

    return NextResponse.json({ course, stats: { enrolled: course._count.enrollments, completed: completedCount } });
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
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
    const nip = (session.user as any).id;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    
    // Zod validation
    const validationResult = updateCourseSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Data tidak valid", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { title, description, thumbnail, categoryId, hasCertificate, certificateBg, certificateConfig, certificateTemplateId } = validationResult.data;

    // Ambil data lama sebelum perubahan
    const oldCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true, description: true, categoryId: true },
      
    });

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(hasCertificate !== undefined && { hasCertificate }),
        ...(certificateBg !== undefined && { certificateBg }),
        ...(certificateConfig !== undefined && { certificateConfig }),
        ...(certificateTemplateId !== undefined && { certificateTemplateId }),
        categoryId,
      },
      include: {
        category: true,
      },
    });

    // Susun detail perubahan
    const changes: string[] = [];
    if (title && title !== oldCourse?.title) changes.push(`Judul: "${oldCourse?.title}" → "${title}"`);
    if (description !== undefined && description !== oldCourse?.description) changes.push(`Deskripsi: diubah`);
    if (categoryId && categoryId !== oldCourse?.categoryId) changes.push(`Kategori: diubah → "${updatedCourse.category?.name || '-'}"`);
    if (thumbnail !== undefined) changes.push(`Thumbnail: diubah`);

    await prisma.auditLog.create({
      data: {
        adminNip: nip,
        action: "EDIT_COURSE",
        entityType: "COURSE",
        entityId: updatedCourse.id,
        details: `Edit kursus: ${updatedCourse.title}\n${changes.length > 0 ? changes.join('\n') : 'Tidak ada perubahan'}`,
      }
    });

    return NextResponse.json({ success: true, course: updatedCourse });
  } catch (error) {
    console.error("Failed to update course:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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
    const nip = (session.user as any).id;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const courseToDelete = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true }
    });

    if (!courseToDelete) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: nip,
        action: "DELETE_COURSE",
        entityType: "COURSE",
        entityId: courseId,
        details: `Hapus kursus: ${courseToDelete.title}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
