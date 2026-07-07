import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nip = (session.user as any).id;
    const body = await req.json();
    
    const { score, moduleId, status = "FINISHED", answers } = body;

    if (!moduleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let calculatedScore = score !== undefined ? parseFloat(score) : 0;

    if (answers) {
      // Calculate score securely on the server
      const qs: any[] = await prisma.$queryRaw`
        SELECT q.id as "qId", o.id as "oId"
        FROM "Question" q 
        JOIN "Option" o ON o."questionId" = q.id 
        WHERE q."moduleId" = ${moduleId} AND o."isCorrect" = true
      `;
      
      let correct = 0;
      const totalQuestions: any[] = await prisma.$queryRaw`SELECT count(*) as count FROM "Question" WHERE "moduleId" = ${moduleId}`;
      const total = Number(totalQuestions[0].count);

      if (total > 0) {
        qs.forEach(row => {
          if (answers[row.qId] === row.oId) {
            correct++;
          }
        });
        calculatedScore = Math.round((correct / total) * 100);
      }
    }

    let previousAttempts = 0;
    const existingScore: any[] = await prisma.$queryRaw`SELECT * FROM "Score" WHERE "userNip" = ${nip} AND "moduleId" = ${moduleId} LIMIT 1`;

    if (existingScore && existingScore.length > 0) {
      if (existingScore[0].feedback) {
        try {
          const fb = JSON.parse(existingScore[0].feedback);
          if (fb.attempts) previousAttempts = fb.attempts;
        } catch (e) {}
      }
    }
    const attempts = previousAttempts + 1;

    // Check if maxRetries is exceeded
    const moduleData = await prisma.module.findUnique({ where: { id: moduleId }});
    if (moduleData && moduleData.type === 'QUIZ' && moduleData.contentPath) {
      try {
        const config = JSON.parse(moduleData.contentPath);
        if (config.maxRetries && config.maxRetries > 0) {
          if (previousAttempts >= config.maxRetries) {
            return NextResponse.json({ error: "Batas maksimal pengulangan telah tercapai" }, { status: 403 });
          }
        }
      } catch (e) {}
    }

    let feedbackValue = "Completed via Kuis";
    if (answers) {
      try { feedbackValue = JSON.stringify({ answers, attempts }); } catch (e) {}
    }

    // Check minimum passing score for GAMIFICATION modules
    if (moduleData && moduleData.type === 'GAMIFICATION' && moduleData.minPassingScore !== null) {
      if (calculatedScore < moduleData.minPassingScore) {
        return NextResponse.json({ 
          error: `Skor Anda (${calculatedScore}) belum mencapai batas minimum kelulusan (${moduleData.minPassingScore}). Silakan coba lagi.`,
          score: calculatedScore,
          minPassingScore: moduleData.minPassingScore,
          passed: false
        }, { status: 400 });
      }
    }

    let newScore;
    if (existingScore && existingScore.length > 0) {
      const id = existingScore[0].id;
      const oldScoreValue = existingScore[0].value || 0;
      
      // Jika skor baru lebih tinggi, simpan skor baru. Jika tidak, pertahankan skor lama.
      const finalScore = calculatedScore > oldScoreValue ? calculatedScore : oldScoreValue;
      
      await prisma.$executeRaw`UPDATE "Score" SET value = ${finalScore}, status = ${status}, feedback = ${feedbackValue} WHERE id = ${id}`;
      newScore = { ...existingScore[0], value: finalScore, status, feedback: feedbackValue };
    } else {
      const newScoreId = crypto.randomUUID();
      await prisma.$executeRaw`INSERT INTO "Score" (id, "userNip", "moduleId", value, status, feedback, "createdAt") VALUES (${newScoreId}, ${nip}, ${moduleId}, ${calculatedScore}, ${status}, ${feedbackValue}, NOW())`;
      newScore = { id: newScoreId, value: calculatedScore, status, feedback: feedbackValue };
    }

    // Update Enrollment Progress — enrollment must already exist
    const courseIdReq = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true }
    });

    if (courseIdReq) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userNip: nip, courseId: courseIdReq.courseId },
        include: {
          course: {
            include: {
              modules: {
                select: { id: true, type: true }
              }
            }
          }
        }
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Anda belum terdaftar di kursus ini. Silakan daftar terlebih dahulu." }, { status: 403 });
      }

      const courseModules = enrollment.course.modules.filter((m: any) => m.type !== 'CATEGORY');
      const totalModules = courseModules.length;

      const finishedScores = await prisma.score.count({
        where: {
          userNip: nip,
          moduleId: { in: courseModules.map((m: any) => m.id) },
          status: 'FINISHED'
        }
      });

      const calculatedProgress = totalModules > 0 ? (finishedScores / totalModules) * 100 : 100;
      const isCompleted = calculatedProgress >= 100;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: calculatedProgress,
          completed: isCompleted,
        }
      });
    }

    let recap: any = null;
    if (status === "FINISHED" && answers) {
      // Send back correct answers for the recapitulation UI
      const qs: any[] = await prisma.$queryRaw`
        SELECT q.id as "qId", o.id as "oId"
        FROM "Question" q 
        JOIN "Option" o ON o."questionId" = q.id 
        WHERE q."moduleId" = ${moduleId} AND o."isCorrect" = true
      `;
      recap = qs.map(q => ({ qId: q.qId, correctOId: q.oId }));
    }

    return NextResponse.json({ success: true, score: newScore, recap });
  } catch (error: any) {
    console.error("Failed to save score:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
