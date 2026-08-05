"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ModerationQueueItem } from "../types";
import { ModerationReviewForm } from "./moderation-review-form";

interface ModerationDetailViewProps {
  id: number;
}

export function ModerationDetailView({ id }: ModerationDetailViewProps) {
  const [item, setItem] = useState<ModerationQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/generated-exercises/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Generated exercise not found");
        }
        throw new Error("Failed to fetch exercise details");
      }
      const data: ModerationQueueItem = await res.json();
      setItem(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);

    try {
      const res = await fetch(`/api/moderation/generated-exercises/${id}/publish`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish exercise");
      }

      const result = await res.json();
      setPublishSuccess(`Exercise successfully published! Created exercise #${result.publishedExerciseId}`);
      fetchDetail(); // Refresh data
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPublishError(err.message);
      } else {
        setPublishError("Failed to publish exercise");
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500">Loading exercise details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link href="/moderation" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Moderation Queue
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error || "Item not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/moderation" className="text-sm text-blue-600 hover:underline font-medium">
          &larr; Back to Queue
        </Link>

        {item.status !== "published" && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {publishing ? "Publishing..." : "Publish to Production"}
          </button>
        )}
      </div>

      {publishError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
          {publishError}
        </div>
      )}

      {publishSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-sm">
          {publishSuccess}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
            <p className="text-sm text-gray-500 mt-1">ID: #{item.id} | Lesson ID: #{item.lessonId}</p>
          </div>
          <span className="px-3 py-1 text-sm font-semibold rounded bg-blue-100 text-blue-800 capitalize">
            {item.status.replace("_", " ")}
          </span>
        </div>

        <p className="text-gray-700 text-sm">{item.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b py-3 text-xs text-gray-600">
          <div>
            <span className="font-semibold block text-gray-900">Type</span>
            {item.exerciseType}
          </div>
          <div>
            <span className="font-semibold block text-gray-900">Difficulty</span>
            {item.difficulty}
          </div>
          <div>
            <span className="font-semibold block text-gray-900">AI Provider</span>
            {item.provider} ({item.model || "N/A"})
          </div>
          <div>
            <span className="font-semibold block text-gray-900">Created At</span>
            {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Exercise Payload (JSON)</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs font-mono overflow-x-auto max-h-96">
            {JSON.stringify(item.content, null, 2)}
          </pre>
        </div>
      </div>

      <ModerationReviewForm
        exerciseId={item.id}
        initialTitle={item.title}
        initialDescription={item.description}
        initialContent={item.content}
        onSuccess={fetchDetail}
      />
    </div>
  );
}