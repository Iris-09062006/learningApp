import { notFound, redirect } from "next/navigation";
import { ExerciseGenerationForm } from "@/features/ai/components/exercise-generation-form";
import { AiServiceError, getExerciseGenerationContext } from "@/features/ai/services/ai-service";

export const metadata = { title: "Generate Lesson Exercise" };

export default async function NewLessonExercisePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const lessonId = Number((await params).lessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) notFound();
  try {
    const context = await getExerciseGenerationContext(lessonId);
    return <ExerciseGenerationForm context={context} />;
  } catch (error: unknown) {
    if (error instanceof AiServiceError && error.code === "UNAUTHENTICATED") redirect("/login");
    if (error instanceof AiServiceError && error.code === "FORBIDDEN") redirect("/dashboard");
    if (error instanceof AiServiceError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}
