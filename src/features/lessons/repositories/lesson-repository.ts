import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProgressStatus } from "@/features/courses/types";
import type { LessonDetail, StartLessonResponse } from "@/features/lessons/types";

function toProgressStatus(status: string | null | undefined): ProgressStatus {
  if (status === "unlocked") return "unlocked";
  if (status === "in_progress") return "inProgress";
  if (status === "completed") return "completed";
  return "locked";
}

export async function fetchLessonDetail(lessonId: number): Promise<{
  lessonExists: boolean;
  isPublished: boolean;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  lesson: LessonDetail | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, chapter_id, title, content, lesson_order, estimated_minutes, is_published, chapters(course_id)")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return {
      lessonExists: false,
      isPublished: false,
      isAuthenticated: false,
      isEnrolled: false,
      lesson: null,
    };
  }

  const courseId = (lesson.chapters as unknown as { course_id: number })?.course_id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      lessonExists: true,
      isPublished: lesson.is_published,
      isAuthenticated: false,
      isEnrolled: false,
      lesson: null,
    };
  }

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment) {
    return {
      lessonExists: true,
      isPublished: lesson.is_published,
      isAuthenticated: true,
      isEnrolled: false,
      lesson: null,
    };
  }

  const { data: progress } = await supabase
    .from("user_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const status = toProgressStatus(progress?.status);

  const { data: exercisesData, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, title, exercise_type, difficulty, exercise_order, is_published")
    .eq("lesson_id", lessonId)
    .eq("is_published", true)
    .order("exercise_order", { ascending: true });

  if (exercisesError) {
    throw new Error(`Failed to fetch exercises: ${exercisesError.message}`);
  }

  const exercises = (exercisesData || []).map((e) => ({
    id: e.id,
    title: e.title,
    type: e.exercise_type,
    difficulty: e.difficulty,
    order: e.exercise_order,
    isPublished: e.is_published,
  }));

  return {
    lessonExists: true,
    isPublished: lesson.is_published,
    isAuthenticated: true,
    isEnrolled: true,
    lesson: {
      id: lesson.id,
      chapterId: lesson.chapter_id,
      courseId,
      title: lesson.title,
      content: lesson.content,
      order: lesson.lesson_order,
      estimatedMinutes: lesson.estimated_minutes,
      status,
      isPublished: lesson.is_published,
      exercises,
    },
  };
}

export async function startLessonProgress(lessonId: number): Promise<StartLessonResponse> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data, error } = await supabase.rpc("start_lesson", {
    p_lesson_id: lessonId,
  });

  if (error) {
    if (error.message === "Authentication required") {
      throw new Error("UNAUTHENTICATED");
    }

    if (error.message === "Published lesson not found") {
      throw new Error("LESSON_NOT_FOUND");
    }

    if (error.message === "Active learner profile required") {
      throw new Error("ACTIVE_LEARNER_REQUIRED");
    }

    if (error.message === "Course enrollment required") {
      throw new Error("COURSE_NOT_ENROLLED");
    }

    if (error.message === "Lesson access required" || error.message === "Lesson is locked") {
      throw new Error("LESSON_LOCKED");
    }

    throw new Error(`Failed to start lesson: ${error.message}`);
  }

  const progress = data as unknown as {
    lesson_id: number;
    status: string;
    started_at: string | null;
  };

  return {
    lessonId: progress.lesson_id,
    status: toProgressStatus(progress.status),
    startedAt: progress.started_at,
  };
}
