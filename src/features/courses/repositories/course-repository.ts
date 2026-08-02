import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CourseSummary, CourseDetail, CourseChapterSummary } from "@/features/courses/types";

export async function fetchCourseSummaries(
  page: number,
  pageSize: number
): Promise<{
  items: CourseSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const supabase = await createServerSupabaseClient();
  const from = (page - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("courses")
    .select(
      "id,slug,title,description,level,language,is_published",
      { count: "exact" }
    )
    .eq("is_published", true)
    .range(from, from + pageSize - 1)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch courses: ${error.message}`);
  }

  const items: CourseSummary[] = (data || []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description ?? null,
    level: c.level,
    language: c.language,
    isPublished: c.is_published,
    isEnrolled: false, // Will be computed in real implementation
    completionPercentage: 0, // Will be computed in real implementation
  }));

  const total = count ?? 0;
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function fetchCourseDetail(
  courseId: number
): Promise<CourseDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select("id,slug,title,description,level,language,is_published")
    .eq("id", courseId)
    .single();

  if (error || !course) {
    if (error?.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch course: ${error?.message || "Not found"}`);
  }

  // Fetch chapters separately due to schema limitations
  const { data: chaptersData, error: chaptersError } = await supabase
    .from("chapters")
    .select("id,title,description,chapter_order,is_published, lessons(count)")
    .eq("course_id", courseId)
    .order("chapter_order", { ascending: true });

  if (chaptersError) {
    throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
  }

  const chapters: CourseChapterSummary[] = (chaptersData || []).map((ch) => ({
    id: ch.id,
    title: ch.title,
    description: ch.description ?? null,
    chapterOrder: ch.chapter_order,
    isPublished: ch.is_published,
    lessonCount: ch.lessons?.[0]?.count ?? 0,
  }));

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description ?? null,
    level: course.level,
    language: course.language,
    isPublished: course.is_published,
    chapterCount: chapters.length,
    lessonCount: chapters.reduce((sum, ch) => sum + ch.lessonCount, 0),
    isEnrolled: false,
    chapters,
  };
}