import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const { name, description, icon, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    // Check for duplicates
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Kategori dengan nama ini sudah ada" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "📚",
        color: color || "#6366f1",
      },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: nip,
        action: "CREATE_CATEGORY",
        entityType: "CATEGORY",
        entityId: category.id,
        details: `Buat kategori baru\nNama: ${name.trim()}\nIkon: ${icon || '📚'}\nWarna: ${color || '#6366f1'}`,
      }
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
