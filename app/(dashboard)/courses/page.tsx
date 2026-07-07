import { prisma } from "@/lib/prisma";
import { BookOpen, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";

// Client component for category filter tabs
import StudentCoursesClient from "./StudentCoursesClient";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function StudentCoursesPage() {
  const session = await getServerSession(authOptions);
  const userNip = (session?.user as any)?.id as string | undefined;
  const enrollments = await prisma.enrollment.findMany({
    where: { userNip },
    select: { courseId: true }
  });
  const enrolledCourseIds = enrollments.map(e => e.courseId);

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      id: { in: enrolledCourseIds }
    },
    include: {
      modules: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return <StudentCoursesClient courses={courses} categories={categories} enrolledCourseIds={enrolledCourseIds} />;
}
