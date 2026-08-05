"use client";

import { useState } from "react";
import type { ReviewStatus, SubmitReviewInput } from "../types";
import type { GeneratedExerciseContent } from "@/features/ai/types";

interface ModerationReviewFormProps {
  exerciseId: number;
  initialTitle: string;
  initialDescription: string;
  initialContent: GeneratedExerciseContent;
  onSuccess: () => void;
}

export function ModerationReviewForm({
  exerciseId,
  initialTitle,
  initialDescription,
  initialContent,
  onSuccess,
}: ModerationReviewFormProps) {
  const [status, setStatus] = useState<ReviewStatus>("approved");
  const [feedback, setFeedback] = useState("");
  
  // Optional edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const [editedDescription, setEditedDescription] = useState(initialDescription);
  const [contentJson, setContentJson] = useState(JSON.stringify(initialContent, null, 2));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let parsedContent: GeneratedExerciseContent | undefined = undefined;

      if (isEditing) {
        try {
          parsedContent = JSON.parse(contentJson);
        } catch {
          throw new Error("Invalid JSON format for edited exercise content");
        }
      }

      const payload: SubmitReviewInput = {
        generatedExerciseId: exerciseId,
        status,
        feedback: feedback.trim() ? feedback.trim() : undefined,
        ...(isEditing && {
          editedTitle: editedTitle.trim() || undefined,
          editedDescription: editedDescription.trim() || undefined,
          editedContent: parsedContent,
        }),
      };

      const res = await fetch(`/api/moderation/generated-exercises/${exerciseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Submit Moderation Review</h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Review Decision</label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex-1 min-w-[120px]">
            <input
              type="radio"
              name="status"
              value="approved"
              checked={status === "approved"}
              onChange={() => setStatus("approved")}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-green-800">Approve</span>
          </label>

          <label className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex-1 min-w-[120px]">
            <input
              type="radio"
              name="status"
              value="needs_revision"
              checked={status === "needs_revision"}
              onChange={() => setStatus("needs_revision")}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-blue-800">Needs Revision</span>
          </label>

          <label className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex-1 min-w-[120px]">
            <input
              type="radio"
              name="status"
              value="rejected"
              checked={status === "rejected"}
              onChange={() => setStatus("rejected")}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-red-800">Reject</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
          Feedback / Reason (Optional)
        </label>
        <textarea
          id="feedback"
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide instructions or notes on your review decision..."
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-semibold text-gray-900">Edit Exercise (Optional)</span>
            <p className="text-xs text-gray-500">Modify exercise title, description, or content structure before approval.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
          >
            {isEditing ? "Cancel Edits" : "Edit Details"}
          </button>
        </div>

        {isEditing && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
            <div>
              <label htmlFor="editedTitle" className="block text-xs font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="editedTitle"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full border rounded p-2 text-sm bg-white"
              />
            </div>

            <div>
              <label htmlFor="editedDescription" className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="editedDescription"
                rows={2}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full border rounded p-2 text-sm bg-white"
              />
            </div>

            <div>
              <label htmlFor="contentJson" className="block text-xs font-medium text-gray-700 mb-1">
                Exercise Content JSON
              </label>
              <textarea
                id="contentJson"
                rows={8}
                value={contentJson}
                onChange={(e) => setContentJson(e.target.value)}
                className="w-full border rounded p-2 text-xs font-mono bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}