# TASK-050 — Separate New Course and Existing Lesson Upload Flows

## Status
`VERIFIED`

## Objective
Make the Document-to-Lesson target choice match the product model explicitly:
creating new content creates a new course whose first chapter is named from the
uploaded document, while existing-content mode targets a lesson already belonging
to an existing course.

## Scope
- Replace the shared curriculum/chapter controls with two independent UI branches.
- In new mode, request only a course title and derive the chapter/initial lesson
  title from the selected filename without its extension.
- Create the unpublished course, chapter, and initial lesson atomically through an
  active-Admin-only RPC.
- In existing mode, retain an explicit existing course/chapter/lesson selector and
  never create curriculum records.
- Preserve existing user-created curriculum, add regression tests, apply the
  Development migration, and deploy the verified Preview.

## Out of Scope
- Full course/chapter/lesson CRUD.
- Editing or deleting the existing `phương pháp tính / Nội suy lagrange` records.
- Stitch-led visual redesign.
- Production database or Production deployment.

## Acceptance Criteria
- New mode does not show a chapter selector or the former standalone
  `Tạo course/chapter` block.
- New mode creates one unpublished course, one unpublished chapter named from the
  file, and one unpublished target lesson atomically.
- Existing mode only accepts an existing lesson target and creates no course,
  chapter, or lesson.
- Validation, security, unit/component tests, full quality gates, Development
  verification, Preview smoke, review, and commit pass.
