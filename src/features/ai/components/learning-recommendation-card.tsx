"use client";

import React from "react";
import Link from "next/link";
import type { LearningRecommendation } from "@/features/ai/types";

interface LearningRecommendationCardProps {
  recommendation: LearningRecommendation | null;
  className?: string;
}

export function LearningRecommendationCard({
  recommendation,
  className = "",
}: LearningRecommendationCardProps) {
  if (!recommendation) {
    return (
      <div
        className={`rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 ${className}`}
        data-testid="no-recommendation-state"
      >
        <p className="text-sm">Chưa có gợi ý học tập nào vào lúc này.</p>
      </div>
    );
  }

  const getBadgeStyle = (type: LearningRecommendation["type"]) => {
    switch (type) {
      case "REVIEW_LESSON":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "COURSE_COMPLETED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "RETRY_EXERCISE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "NEXT_LESSON":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  return (
    <div
      className={`rounded-lg border border-blue-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      data-testid="learning-recommendation-card"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getBadgeStyle(
            recommendation.type
          )}`}
        >
          Gợi ý học tập
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
        {recommendation.title}
      </h3>

      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {recommendation.description}
      </p>

      <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
        {recommendation.reason}
      </p>

      <div className="mt-4">
        <Link
          href={recommendation.targetUrl}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          data-testid="recommendation-action-link"
        >
          {recommendation.type === "REVIEW_LESSON"
            ? "Xem lại bài học"
            : recommendation.type === "COURSE_COMPLETED"
            ? "Xem lại tổng quan"
            : "Học ngay"}
        </Link>
      </div>
    </div>
  );
}