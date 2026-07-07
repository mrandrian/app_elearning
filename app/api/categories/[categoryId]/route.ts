import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
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
    const { name, description, icon, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    // Check for duplicate name (excluding self)
    const existing = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: categoryId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Kategori dengan nama ini sudah ada" }, { status: 409 });
    }

    // Ambil data lama sebelum perubahan
    const oldCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true, description: true, icon: true, color: true },
    });

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "📚",
        color: color || "#6366f1",
      },
    });

    // Susun detail perubahan
    const changes: string[] = [];
    if (name.trim() !== oldCategory?.name) changes.push(`Nama: "${oldCategory?.name}" → "${name.trim()}"`);
    if ((description?.trim() || null) !== oldCategory?.description) changes.push(`Deskripsi: diubah`);
    if ((icon || "📚") !== oldCategory?.icon) changes.push(`Ikon: "${oldCategory?.icon}" → "${icon || '📚'}"`);
    if ((color || "#6366f1") !== oldCategory?.color) changes.push(`Warna: "${oldCategory?.color}" → "${color || '#6366f1'}"`);

    await prisma.auditLog.create({
      data: {
        adminNip: nip,
        action: "EDIT_CATEGORY",
        entityType: "CATEGORY",
        entityId: categoryId,
        details: `Edit kategori: ${name.trim()}\n${changes.length > 0 ? changes.join('\n') : 'Tidak ada perubahan'}`,
      }
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const nip = (session.user as any).id;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { courses: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Unlink courses first (set categoryId to null), then delete category
    await prisma.course.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id: categoryId },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: nip,
        action: "DELETE_CATEGORY",
        entityType: "CATEGORY",
        entityId: categoryId,
        details: `Hapus kategori: ${category.name}\nJumlah kursus terdampak: ${category._count.courses}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
