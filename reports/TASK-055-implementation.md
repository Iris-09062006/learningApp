# TASK-055 Implementation Report

## Outcome

LearningApp now turns one extracted PDF into one reviewable unpublished Course
containing 2–20 ordered, cited Lesson drafts. Course generation cannot return or
persist exercises. Admin approval publishes the entire Course batch atomically;
approve/reject decisions persist and resolved batches disappear from the pending
queue after refresh.

AI exercise generation is exposed separately in Admin content UI for exactly one
published Lesson. The existing backend reads that Lesson's current title/content,
persists `generated_exercises.lesson_id`, and leaves the result pending in the
separate moderation workflow.

## Implementation

- Rebuilt `.ua/knowledge-graph.json` from current HEAD before tracing the changed
  codebase: 444 scanned files, 746 nodes, 1,053 edges, 10 architecture layers, and
  no graph integrity errors.
- Added strict Course structured output with Course metadata, 2–20 Lessons, cited
  sections, unknown-field rejection, prompt-injection boundary, and an explicit
  prohibition on exercises/quizzes/answers/solutions.
- Added migration `023` with active-Admin, empty-search-path RPCs for atomic batch
  creation and review resolution, reusing existing curriculum, draft, citation,
  publication, progress, and audit models.
- Added unresolved Course batch query and Admin routes.
- Reworked `/admin/content` into separate PDF-to-Course review and per-Lesson
  exercise generation sections with loading, empty, retry, error, review, editing,
  success, and responsive states.
- Moved active Moderator/Admin authorization ahead of Lesson context reads and AI
  provider calls in exercise generation.
- Preserved one-Lesson endpoints/RPCs as a compatibility path for historical data.
- Updated generated types and product, architecture, database, API, security, UI,
  feature, and pipeline documentation.

## Scope and deployment

Migration `023` was not applied to a shared/production Supabase project. No push or
deployment was performed. Existing user changes in `AGENTS.md`, `docs/decisions.md`,
and untracked probe files were preserved and excluded from the task commit.
