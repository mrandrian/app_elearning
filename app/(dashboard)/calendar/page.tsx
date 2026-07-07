import { Calendar as CalendarIcon, Clock, MapPin, Video, PlayCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CalendarPage() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      modules: true
    }
  });

  const events: any[] = [];

  courses.forEach(course => {
    course.modules.forEach(mod => {
      if (mod.contentPath && mod.contentPath.startsWith('{')) {
        try {
          const config = JSON.parse(mod.contentPath);
          if (config.availableAt) {
            events.push({
              id: mod.id,
              courseId: course.id,
              courseTitle: course.title,
              title: mod.title,
              type: mod.type,
              date: new Date(config.availableAt),
              url: config.url || null
            });
          }
        } catch (e) {}
      }
    });
  });

  // Sort upcoming events first
  const sortedEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcomingEvents = sortedEvents.filter(e => e.date.getTime() + 86400000 > new Date().getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kalender Pelatihan</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Jadwal sesi sinkron (tatap muka virtual atau kelas fisik).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6 flex items-center justify-center min-h-[250px] md:min-h-[400px]">
          <div className="text-center">
             <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
               <CalendarIcon className="w-8 h-8" />
             </div>
             <p className="text-slate-500 font-medium">Anda memiliki {upcomingEvents.length} jadwal mendatang.</p>
             <p className="text-sm text-slate-400 mt-1">Tampilan Kalender Penuh sedang dalam pengembangan.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-slate-900">Jadwal Mendatang</h3>
          
          {upcomingEvents.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-sm">Belum ada jadwal sesi virtual yang akan datang.</p>
            </div>
          ) : (
            upcomingEvents.map((event, idx) => {
              const isMeet = event.type === 'LINK';
              const isToday = event.date.toDateString() === new Date().toDateString();
              
              return (
                <Link key={event.id} href={`/course/${event.courseId}/module/${event.id}`}>
                  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow mb-4 border-l-4 ${isMeet ? 'border-l-rose-500' : 'border-l-indigo-500'}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isMeet ? 'text-rose-600' : 'text-indigo-600'}`}>
                      {isToday ? "Hari Ini" : event.date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">{event.title}</h4>
                    <p className="text-xs text-slate-500 mb-3">{event.courseTitle}</p>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{event.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMeet ? <Video className="w-4 h-4 text-slate-400" /> : <PlayCircle className="w-4 h-4 text-slate-400" />}
                        <span>{isMeet ? 'Video Conference' : 'Materi Pembelajaran'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
