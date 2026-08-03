import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseDetailView } from "../course-detail-view";
import type { CourseDetail } from "@/features/courses/types";

const baseDetail: CourseDetail = {
  id: 1,
  slug: "python-basic",
  title: "Python Basic",
  description: "Learn Python from scratch.",
  level: "beginner",
  language: "python",
  isPublished: true,
  chapterCount: 2,
  lessonCount: 5,
  isEnrolled: false,
  chapters: [
    { id: 10, title: "Intro", description: "Hello", chapterOrder: 1, isPublished: true, lessonCount: 2 },
    { id: 11, title: "Data Types", description: null, chapterOrder: 2, isPublished: true, lessonCount: 3 },
  ],
};

describe("CourseDetailView", () => {
  it("renders course headers and basic stats", () => {
    render(<CourseDetailView course={baseDetail} />);
    expect(screen.getByText("Python Basic")).toBeInTheDocument();
    expect(screen.getByText("PYTHON")).toBeInTheDocument();
    expect(screen.getByText("Cấp độ: beginner")).toBeInTheDocument();
    expect(screen.getByText("Learn Python from scratch.")).toBeInTheDocument();
    expect(screen.getByText(/2 chương/)).toBeInTheDocument();
    expect(screen.getByText(/5 bài học/)).toBeInTheDocument();
  });

  it("renders enrollment status when enrolled", () => {
    const enrolled = { ...baseDetail, isEnrolled: true };
    render(<CourseDetailView course={enrolled} />);
    expect(screen.getByText(/Bạn đã đăng ký khóa học/i)).toBeInTheDocument();
  });

  it("renders enrollment status when not enrolled", () => {
    render(<CourseDetailView course={baseDetail} />);
    expect(screen.getByText(/Đăng ký sẽ sớm khả dụng/i)).toBeInTheDocument();
  });

  it("renders chapter lists", () => {
    render(<CourseDetailView course={baseDetail} />);
    expect(screen.getByText("Chương 1: Intro")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Chương 2: Data Types")).toBeInTheDocument();
    expect(screen.getByText(/2 bài học/)).toBeInTheDocument();
    expect(screen.getByText(/3 bài học/)).toBeInTheDocument();
  });

  it("renders empty state for chapters", () => {
    render(<CourseDetailView course={{ ...baseDetail, chapters: [] }} />);
    expect(
      screen.getByText("Nội dung bài học đang được cập nhật.")
    ).toBeInTheDocument();
  });
});