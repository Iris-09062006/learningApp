import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  getCourseById: vi.fn(),
  getCourseRoadmap: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    cache: <Args extends unknown[], Result>(fn: (...args: Args) => Result) => {
      const entries = new Map<string, Result>();
      return (...args: Args): Result => {
        const key = JSON.stringify(args);
        if (!entries.has(key)) entries.set(key, fn(...args));
        return entries.get(key)!;
      };
    },
  };
});

vi.mock("@/features/courses/services/course-service", () => ({
  getCourseById: serviceMocks.getCourseById,
  getCourseRoadmap: serviceMocks.getCourseRoadmap,
  ServiceError: class ServiceError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  },
}));

import CourseDetailPage, {
  generateMetadata as generateCourseMetadata,
} from "./page";
import CourseRoadmapPage, {
  generateMetadata as generateRoadmapMetadata,
} from "./roadmap/page";

describe("course page request memoization", () => {
  beforeEach(() => {
    serviceMocks.getCourseById.mockReset();
    serviceMocks.getCourseRoadmap.mockReset();
  });

  it("shares the course detail load between metadata and page rendering", async () => {
    serviceMocks.getCourseById.mockResolvedValue({
      id: 401,
      title: "Python foundations",
      description: "Course description",
    });
    const params = Promise.resolve({ courseId: "401" });

    await generateCourseMetadata({ params });
    await CourseDetailPage({ params });

    expect(serviceMocks.getCourseById).toHaveBeenCalledTimes(1);
    expect(serviceMocks.getCourseById).toHaveBeenCalledWith(401);
  });

  it("shares the roadmap load between metadata and page rendering", async () => {
    serviceMocks.getCourseRoadmap.mockResolvedValue({
      course: { id: 402, title: "Python roadmap" },
      completionPercentage: 0,
      chapters: [],
    });
    const params = Promise.resolve({ courseId: "402" });

    await generateRoadmapMetadata({ params });
    await CourseRoadmapPage({ params });

    expect(serviceMocks.getCourseRoadmap).toHaveBeenCalledTimes(1);
    expect(serviceMocks.getCourseRoadmap).toHaveBeenCalledWith(402);
  });
});
