import React from "react";
import Link from "next/link";
import type { CourseProgressResponse } from "@/features/progress/types";

interface ProgressSummaryCardProps {
  progress: CourseProgressResponse;
}

export function ProgressSummaryCard({ progress }: ProgressSummaryCardProps) {
  const { completedLessons, totalLessons, completionPercentage, lastAccessedLessonId } = progress;

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-card-foreground">
        Course Progress
      </h3>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {completedLessons} of {totalLessons} lessons completed
        </span>
        <span className="text-sm font-bold text-foreground">
          {completionPercentage}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
          role="progressbar"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {lastAccessedLessonId && (
        <div className="mt-4 border-t pt-4">
          <Link
            href={`/lessons/${lastAccessedLessonId}`}
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Resume Learning &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}