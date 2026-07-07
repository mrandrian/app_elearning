import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nip = (session.user as any).id;

    const moduleData = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" },
            },
            enrollments: {
              where: { userNip: nip }
            }
          },
        },
      },
    });

    if (!moduleData) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const role = (session.user as any).role;
    if (role === "STUDENT" && moduleData.course.enrollments.length === 0) {
      return NextResponse.json({ error: "Silakan mendaftar kursus terlebih dahulu." }, { status: 403 });
    }

    const scores: any[] = await prisma.$queryRaw`SELECT * FROM "Score" WHERE "moduleId" = ${moduleId} AND "userNip" = ${nip} LIMIT 1`;
    const existingScore = scores.length > 0 ? scores[0] : null;

    // Fetch all completed modules in this course for this user
    const completedScores: any[] = await prisma.$queryRaw`
      SELECT s."moduleId" 
      FROM "Score" s
      JOIN "Module" m ON s."moduleId" = m.id
      WHERE m."courseId" = ${moduleData.courseId} AND s."userNip" = ${nip} AND s.status = 'FINISHED'
    `;
    const completedModules = completedScores.map(s => s.moduleId);

    return NextResponse.json({ module: moduleData, score: existingScore, completedModules });
  } catch (error) {
    console.error("Failed to fetch module:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, contentPath, minPassingScore } = body;

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ambil data lama sebelum perubahan
    const oldModule = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { title: true, type: true },
    });

    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(contentPath !== undefined && { contentPath }),
        ...(minPassingScore !== undefined && { minPassingScore: minPassingScore !== null ? minPassingScore : null }),
      },
    });

    // Susun detail perubahan
    const changes: string[] = [];
    if (title && title !== oldModule?.title) changes.push(`Judul: "${oldModule?.title}" → "${title}"`);
    if (type && type !== oldModule?.type) changes.push(`Tipe: "${oldModule?.type}" → "${type}"`);
    if (contentPath !== undefined) changes.push(`Pengaturan konten: diubah`);

    await prisma.auditLog.create({
      data: {
        adminNip: (session.user as any).id,
        action: "EDIT_MODULE",
        entityType: "MODULE",
        entityId: moduleId,
        details: `Edit modul: ${updatedModule.title}\n${changes.length > 0 ? changes.join('\n') : 'Tidak ada perubahan'}`,
      }
    });

    return NextResponse.json({ success: true, module: updatedModule });
  } catch (error) {
    console.error("Failed to update module:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const moduleToDelete = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" }
            }
          }
        }
      }
    });

    if (!moduleToDelete) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }


    let idsToDelete = [moduleId];

    if (moduleToDelete.type === 'CATEGORY') {
      const allModules = moduleToDelete.course.modules;
      const startIndex = allModules.findIndex(m => m.id === moduleId);
      
      for (let i = startIndex + 1; i < allModules.length; i++) {
        if (allModules[i].type === 'CATEGORY') {
          break;
        }
        idsToDelete.push(allModules[i].id);
      }
    }

    await prisma.module.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    const deletedNames = idsToDelete.length > 1 
      ? `\nModul terhapus: ${moduleToDelete.course.modules.filter(m => idsToDelete.includes(m.id)).map(m => m.title).join(', ')}`
      : '';

    await prisma.auditLog.create({
      data: {
        adminNip: (session.user as any).id,
        action: "DELETE_MODULE",
        entityType: "MODULE",
        entityId: moduleId,
        details: `Hapus modul: ${moduleToDelete.title} (Tipe: ${moduleToDelete.type})\nKursus: ${moduleToDelete.course.title}${deletedNames}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete module:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
