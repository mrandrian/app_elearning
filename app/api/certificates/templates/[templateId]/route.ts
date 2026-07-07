import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, backgroundImage, config } = body;

    const updatedTemplate = await prisma.certificateTemplate.update({
      where: { id: templateId },
      data: {
        ...(name && { name }),
        ...(backgroundImage && { backgroundImage }),
        ...(config && { config: typeof config === "string" ? config : JSON.stringify(config) }),
      },
    });

    return NextResponse.json({ success: true, template: updatedTemplate });
  } catch (error) {
    console.error("Failed to update template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get template data for audit log
    const templateToDelete = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
      select: { name: true }
    });

    await prisma.certificateTemplate.delete({
      where: { id: templateId },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: (session.user as any).id,
        action: "DELETE_CERT_TEMPLATE",
        entityType: "CERTIFICATE_TEMPLATE",
        entityId: templateId,
        details: `Hapus template sertifikat: ${templateToDelete?.name || templateId}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
