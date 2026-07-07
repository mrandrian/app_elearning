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
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const templates = await prisma.certificateTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
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
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, backgroundImage, config } = body;

    if (!name || !backgroundImage || !config) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newTemplate = await prisma.certificateTemplate.create({
      data: {
        name,
        backgroundImage,
        config: typeof config === "string" ? config : JSON.stringify(config),
      },
    });

    return NextResponse.json({ success: true, template: newTemplate });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
