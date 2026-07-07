import { BentoGrid, BentoCard } from "@/components/BentoGrid";
import { BookOpen, PlayCircle, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseStatsClient from "./CourseStatsClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isStudent = user?.role === "STUDENT";
  const isAdminOrSuper = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Ambil jumlah kursus yang tersedia jika ia adalah student
  const availableCoursesCount = await prisma.course.count({
    where: { published: true }
  });

  const scoreCount = user?.id ? await prisma.score.count({
    where: { userNip: user.id }
  }) : 0;

  // Ambil sertifikat yang dikumpulkan
  const certificateCount = user?.id ? await prisma.enrollment.count({
    where: {
      userNip: user.id,
      completed: true,
      course: {
        hasCertificate: true
      }
    }
  }) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Selamat Datang, {user?.name || "Pegawai"}
        </h1>
        <p className="text-slate-500 mt-2">
          {isAdminOrSuper ? "Berikut adalah ringkasan analitik dan statistik sistem e-learning." : "Berikut adalah ringkasan progres belajar Anda hari ini."}
        </p>
      </div>

      {isAdminOrSuper ? (
        <AdminAnalytics />
      ) : (
        <BentoGrid>
          <BentoCard
            title="Kursus Tersedia"
            description={
              <div className="space-y-3 mt-2">
                <p>Ada {availableCoursesCount} kursus yang bisa Anda ikuti.</p>
                <Link href="/courses" className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors text-sm">
                  Lihat Katalog Kursus
                </Link>
              </div>
            }
            icon={<BookOpen className="w-8 h-8 text-indigo-500 mb-4" />}
            className="col-span-1 md:col-span-2"
          />
          <BentoCard
            title="Modul Diselesaikan"
            description={`${scoreCount} modul telah diselesaikan.`}
            icon={<CheckCircle className="w-8 h-8 text-emerald-500 mb-4" />}
          />
          <BentoCard
            title="Video Terakhir"
            description="Lanjutkan menonton: Pengantar Kebijakan Publik."
            icon={<PlayCircle className="w-8 h-8 text-blue-500 mb-4" />}
          />
          <BentoCard
            title="Sertifikat"
            description={`Anda telah mengumpulkan ${certificateCount} sertifikat kompetensi.`}
            icon={<FileText className="w-8 h-8 text-amber-500 mb-4" />}
            className="col-span-1 md:col-span-2"
          />
        </BentoGrid>
      )}
    </div>
  );
}

async function AdminAnalytics() {
  const totalUsers = await prisma.user.count({ where: { role: "STUDENT" } });
  const totalCourses = await prisma.course.count();
  const totalEnrollments = await prisma.enrollment.count();
  const totalCompleted = await prisma.enrollment.count({ where: { completed: true } });

  const coursesWithStats = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { enrollments: true } },
      enrollments: { where: { completed: true }, select: { id: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <div className="space-y-6">
      <BentoGrid>
        <BentoCard
          title="Total Peserta"
          description={`${totalUsers} siswa terdaftar di sistem.`}
          icon={<BookOpen className="w-8 h-8 text-blue-500 mb-4" />}
        />
        <BentoCard
          title="Total Kursus"
          description={`${totalCourses} kursus tersedia.`}
          icon={<PlayCircle className="w-8 h-8 text-indigo-500 mb-4" />}
        />
        <BentoCard
          title="Total Pendaftaran"
          description={`${totalEnrollments} pendaftaran kursus.`}
          icon={<CheckCircle className="w-8 h-8 text-emerald-500 mb-4" />}
        />
        <BentoCard
          title="Sertifikat Diterbitkan"
          description={`${totalCompleted} siswa telah lulus.`}
          icon={<FileText className="w-8 h-8 text-amber-500 mb-4" />}
        />
      </BentoGrid>

      <CourseStatsClient courses={coursesWithStats} />
    </div>
  );
}
