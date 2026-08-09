import { notFound, redirect } from "next/navigation";

import { ExerciseView } from "@/features/exercises/components/exercise-view";
import { fetchExerciseData } from "@/features/exercises/repositories/exercise-repository";

interface ExercisePageProps {
  params: Promise<{ exerciseId: string }>;
}

export const dynamic = "force-dynamic";

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { exerciseId: exerciseIdParam } = await params;
  const exerciseId = Number(exerciseIdParam);

  if (!Number.isInteger(exerciseId) || exerciseId < 1) {
    notFound();
  }

  const result = await fetchExerciseData(exerciseId);

  if (!result.isAuthenticated) {
    redirect(`/login?next=${encodeURIComponent(`/exercises/${exerciseId}`)}`);
  }

  if (!result.exerciseExists || !result.isPublished) {
    notFound();
  }

  if (!result.isEnrolled || !result.exercise) {
    redirect("/courses");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ExerciseView exercise={result.exercise} />
      </div>
    </main>
  );
}
