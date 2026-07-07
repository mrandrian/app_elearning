import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ scoreId: string }> }
) {
  try {
    const { scoreId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify score exists and get details for audit log
    const scoreToDelete = await prisma.score.findUnique({
      where: { id: scoreId },
      include: {
        user: { select: { name: true, nip: true } },
        module: { select: { title: true } }
      }
    });

    if (!scoreToDelete) {
      return NextResponse.json({ error: "Score not found" }, { status: 404 });
    }

    await prisma.score.delete({
      where: { id: scoreId }
    });

    await prisma.auditLog.create({
      data: {
        adminNip: (session.user as any).id,
        action: "DELETE_SCORE",
        entityType: "SCORE",
        entityId: scoreId,
        details: `Hapus skor\nPeserta: ${scoreToDelete.user.name} (${scoreToDelete.user.nip})\nModul: ${scoreToDelete.module.title}\nNilai: ${scoreToDelete.value}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete score:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
