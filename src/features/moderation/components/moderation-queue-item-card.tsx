import Link from "next/link";
import type { ModerationQueueItem } from "../types";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  
  return date.toLocaleDateString();
}

interface ModerationQueueItemCardProps {
  item: ModerationQueueItem;
}

export function ModerationQueueItemCard({ item }: ModerationQueueItemCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Pending</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Approved</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">Rejected</span>;
      case "needs_revision":
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">Needs Revision</span>;
      case "published":
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">Published</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const difficultyColors: Record<string, string> = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };

  const difficultyClass = difficultyColors[item.difficulty as string] || "bg-gray-100 text-gray-800";

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-900 truncate" title={item.title}>
          {item.title}
        </h3>
        <div className="flex space-x-2 shrink-0">
          {getStatusBadge(item.status)}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {item.description || "No description provided."}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
          {item.exerciseType}
        </span>
        <span className={`px-2 py-1 text-xs rounded ${difficultyClass}`}>
          {item.difficulty}
        </span>
        {item.lessonTitle && (
          <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 max-w-[200px] truncate" title={item.lessonTitle}>
            Lesson: {item.lessonTitle}
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500 mt-4 border-t pt-3">
        <span>Generated {formatRelativeTime(item.createdAt)}</span>
        <Link 
          href={`/moderation/${item.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Review Exercise &rarr;
        </Link>
      </div>
    </div>
  );
}