import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CourseManagementView } from "../course-management-view";

const courses = [{
  id: 7,
  title: "Python căn bản",
  slug: "python-can-ban",
  isPublished: true,
  createdAt: "2026-08-01T00:00:00Z",
}];

describe("CourseManagementView", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requires confirmation and removes a successfully archived course", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { courseId: 7, archivedAt: "2026-08-10T00:00:00Z", auditLogId: 9 },
    }), { status: 200 }));
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("fetch", fetchMock);
    render(<CourseManagementView initialCourses={courses} />);

    fireEvent.click(screen.getByRole("button", { name: "Xóa khóa học" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/courses/7", { method: "DELETE" }));
    expect(await screen.findByRole("status")).toHaveTextContent("audit log");
    expect(screen.queryByText("Python căn bản")).not.toBeInTheDocument();
  });

  it("does not call the API when deletion is cancelled", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.stubGlobal("fetch", fetchMock);
    render(<CourseManagementView initialCourses={courses} />);
    fireEvent.click(screen.getByRole("button", { name: "Xóa khóa học" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
