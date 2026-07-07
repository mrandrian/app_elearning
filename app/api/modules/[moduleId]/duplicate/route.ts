import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
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

    const { moduleId } = await params;

    const sourceModule = await prisma.module.findUnique({
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

    if (!sourceModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }


    const allModules = sourceModule.course.modules;
    const sourceIndex = allModules.findIndex(m => m.id === moduleId);

    let modulesToDuplicate: any[] = [sourceModule];

    // If it's a category, find all modules under it until the next category
    if (sourceModule.type === 'CATEGORY') {
      modulesToDuplicate = [sourceModule];
      for (let i = sourceIndex + 1; i < allModules.length; i++) {
        if (allModules[i].type === 'CATEGORY') {
          break;
        }
        modulesToDuplicate.push(allModules[i]);
      }
    }

    // Construct the new modules
    const newModulesData = [];
    for (const mod of modulesToDuplicate) {
      let newTitle = mod.title + " (Copy)";
      // If duplicating a category, maybe just add (Copy) to the category.
      // But if it's a sub-module of a duplicated category, it's fine to just add (Copy) to all, or leave as is.
      // Let's add (Copy) to all so it's obvious.
      
      newModulesData.push({
        courseId: sourceModule.courseId,
        title: mod.id === moduleId || mod.type === 'CATEGORY' ? mod.title + " (Copy)" : mod.title,
        type: mod.type,
        contentPath: mod.contentPath,
      });
    }

    // Insert them into the list
    const newModules = [];
    for (let i = 0; i < newModulesData.length; i++) {
      const created = await prisma.module.create({
        data: {
          ...newModulesData[i],
          order: 99999 + i, // Temp order, we will re-sync
        }
      });
      newModules.push(created);
    }

    // Reconstruct the full list to calculate correct order
    const updatedList = [...allModules];
    // Insert newModules right after the last duplicated module
    const insertIndex = sourceIndex + modulesToDuplicate.length;
    updatedList.splice(insertIndex, 0, ...newModules);

    // Re-sync all orders
    const updatePromises = updatedList.map((m, idx) => 
      prisma.module.update({
        where: { id: m.id },
        data: { order: idx }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to duplicate module:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
