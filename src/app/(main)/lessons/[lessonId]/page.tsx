import { notFound, redirect } from "next/navigation";

import { LessonContentView } from "@/features/lessons/components/lesson-content-view";
import {
  getLessonById,
  ServiceError,
} from "@/features/lessons/services/lesson-service";

interface LessonPageProps {
  params: Promise<{ lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId: lessonIdParam } = await params;
  const lessonId = Number(lessonIdParam);

  if (!Number.isInteger(lessonId) || lessonId < 1) {
    notFound();
  }

  let lesson;
  try {
    lesson = await getLessonById(lessonId);
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      if (error.code === "NOT_FOUND") {
        notFound();
      }
      redirect("/courses");
    }
    throw error;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <LessonContentView lesson={lesson} />
      </div>
    </main>
  );
}
