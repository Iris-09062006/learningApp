import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExerciseGenerationForm } from "./exercise-generation-form";

describe("ExerciseGenerationForm", () => {
  it("submits the fixed Lesson route context and links the pending draft to moderation", async () => {
    let requestBody: Record<string, unknown> | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ generatedExercise: { id: 88, lessonId: 51, title: "Dự đoán", status: "pending" } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });

    render(<ExerciseGenerationForm context={{
      lessonId: 51,
      lessonTitle: "Biến",
      lessonContent: "x = 1",
      learningObjectives: ["Hiểu phép gán"],
      courseTitle: "Python cơ bản",
      courseDescription: null,
    }} />);

    fireEvent.click(screen.getByRole("button", { name: "Sinh Exercise draft" }));
    expect(await screen.findByRole("link", { name: "Mở draft" })).toHaveAttribute("href", "/moderation/88");
    await waitFor(() => expect(requestBody).toMatchObject({ lessonId: 51, learningObjective: "Hiểu phép gán" }));
    expect(screen.queryByLabelText("Lesson")).not.toBeInTheDocument();
  });
});
