import React from "react";
import Link from "next/link";
import type { CourseSummary } from "@/features/courses/types";

interface CourseCardProps {
  course: CourseSummary;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div
      data-testid="course-card"
      className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-block rounded bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            {course.language.toUpperCase()}
          </span>
          <span className="text-xs text-slate-500 capitalize dark:text-slate-400">
            {course.level}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
          {course.title}
        </h3>

        <p className="mt-2 text-sm text-slate-600 line-clamp-2 dark:text-slate-300">
          {course.description || "Chưa có mô tả cho khóa học này."}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        {course.isEnrolled ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Đã đăng ký ({course.completionPercentage ?? 0}%)
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Chưa đăng ký
          </span>
        )}

        <Link
          href={`/courses/${course.id}`}
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          {course.isEnrolled ? "Tiếp tục học" : "Xem chi tiết"} &rarr;
        </Link>
      </div>
    </div>
  );
};