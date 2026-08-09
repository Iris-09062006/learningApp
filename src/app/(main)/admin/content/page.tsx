import { redirect } from "next/navigation";

import { AdminServiceError, assertAdminAccess } from "@/features/admin/services/admin-service";
import { ContentPipelineAdmin } from "@/features/content-pipeline/components/content-pipeline-admin";

export const metadata = {
  title: "Document-to-Lesson | LearningApp Admin",
  description: "Create and review cited lesson drafts from private source documents.",
};

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  try {
    await assertAdminAccess();
    return <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><ContentPipelineAdmin /></div></main>;
  } catch (error) {
    if (error instanceof AdminServiceError && error.code === "UNAUTHENTICATED") redirect("/login");
    if (error instanceof AdminServiceError && error.code === "FORBIDDEN") redirect("/dashboard");
    throw error;
  }
}
