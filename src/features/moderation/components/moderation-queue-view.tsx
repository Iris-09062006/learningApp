"use client";

import { useState, useEffect, useCallback } from "react";
import type { ModerationQueueItem, ModerationQueueResult } from "../types";
import { ModerationQueueItemCard } from "./moderation-queue-item-card";

export function ModerationQueueView() {
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") {
        queryParams.set("status", statusFilter);
      }
      queryParams.set("page", page.toString());
      queryParams.set("limit", limit.toString());

      const res = await fetch(`/api/moderation/generated-exercises?${queryParams.toString()}`);
      
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access denied. Moderator privileges required.");
        }
        throw new Error("Failed to load moderation queue");
      }

      const data: ModerationQueueResult = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Exercise Moderation Queue</h2>
          <p className="text-sm text-gray-500">Review AI-generated exercises before publishing</p>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="needs_revision">Needs Revision</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">Loading queue items...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          <p className="font-semibold">Error loading queue</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No exercises found matching the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <ModerationQueueItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages} ({total} items)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}