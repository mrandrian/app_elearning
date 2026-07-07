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

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { z } from "zod";

const createCourseSchema = z.object({
  title: z.string().min(3, "Judul kursus minimal 3 karakter").max(255),
  description: z.string().optional(),
  published: z.boolean().optional(),
  thumbnail: z.string().nullable().optional(),
  categoryId: z.string().min(1, "Kategori wajib diisi"),
});

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
    
    // Zod validation
    const validationResult = createCourseSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Data tidak valid", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { title, description, published, thumbnail, categoryId } = validationResult.data;

    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        published: published ?? false,
        thumbnail: thumbnail || null,
        teacherNip: nip,
        categoryId: categoryId,
      },
      include: {
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: nip,
        action: "CREATE_COURSE",
        entityType: "COURSE",
        entityId: newCourse.id,
        details: `Buat kursus baru\nJudul: ${title}\nKategori: ${newCourse.category?.name || '-'}\nStatus: ${published ? 'Dipublikasikan' : 'Draft'}`,
      }
    });

    return NextResponse.json({ success: true, course: newCourse });
  } catch (error) {
    console.error("Failed to create course:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
