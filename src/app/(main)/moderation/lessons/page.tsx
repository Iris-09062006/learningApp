import Link from "next/link";
import { redirect } from "next/navigation";
import { AiServiceError, getExerciseLessonTargets } from "@/features/ai/services/ai-service";

export const metadata = { title: "Choose Lesson for Exercise" };

export default async function ExerciseLessonListPage() {
  let lessons;
  try {
    lessons = await getExerciseLessonTargets();
  } catch (error: unknown) {
    if (error instanceof AiServiceError && error.code === "UNAUTHENTICATED") redirect("/login");
    if (error instanceof AiServiceError && error.code === "FORBIDDEN") redirect("/dashboard");
    throw error;
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Lesson → Exercise</h1><p className="mt-1 text-sm text-slate-600">Chọn đúng một Lesson đã publish để tạo Exercise draft.</p></div>
      <Link href="/moderation" className="text-sm font-semibold text-indigo-700">Hàng moderation →</Link>
    </div>
    {lessons.length === 0 ? <p className="rounded-lg border p-4 text-sm">Chưa có Lesson đã publish.</p> : <ul className="grid gap-4 md:grid-cols-2">{lessons.map((lesson) => <li key={lesson.lessonId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{lesson.courseTitle}</p><h2 className="mt-1 font-bold">{lesson.lessonTitle}</h2><Link href={`/moderation/lessons/${lesson.lessonId}/exercises/new`} className="mt-4 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Tạo Exercise</Link></li>)}</ul>}
  </div>;
}
