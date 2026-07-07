import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId } = await params;
    const { moduleIds } = await req.json();

    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json({ error: "Invalid moduleIds array" }, { status: 400 });
    }

    // Validate all moduleIds belong to this course
    const validModules = await prisma.module.count({
      where: {
        id: { in: moduleIds },
        courseId: courseId,
      }
    });

    if (validModules !== moduleIds.length) {
      return NextResponse.json({ error: "Some modules do not belong to this course" }, { status: 400 });
    }

    // Update the order for each module
    const updatePromises = moduleIds.map((id: string, index: number) => 
      prisma.module.update({
        where: { id },
        data: { order: index },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder modules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
