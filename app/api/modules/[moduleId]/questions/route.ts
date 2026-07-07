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

    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

    const questions = await prisma.question.findMany({
      where: { moduleId },
      include: {
        options: {
          select: {
            id: true,
            text: true,
            isCorrect: true,
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    // Strip isCorrect from responses for non-admin users to prevent answer leakage
    if (!isAdmin) {
      const sanitized = questions.map(q => ({
        ...q,
        options: q.options.map(({ isCorrect, ...opt }) => opt)
      }));
      return NextResponse.json({ questions: sanitized });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
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

    const body = await req.json();
    const { questions } = body; // Array of { text, options: [{ text, isCorrect }] }

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Delete existing questions for this module to replace them
    await prisma.question.deleteMany({
      where: { moduleId }
    });

    // Insert new questions
    for (const q of questions) {
      await prisma.question.create({
        data: {
          moduleId,
          text: q.text,
          options: {
            create: q.options.map((opt: any) => ({
              text: opt.text,
              isCorrect: opt.isCorrect === true || opt.isCorrect === "true"
            }))
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save questions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
