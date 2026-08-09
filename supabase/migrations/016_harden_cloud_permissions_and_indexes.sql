-- Supabase projects created after the Data API privilege change grant new
-- functions to API roles explicitly. Remove legacy anonymous access and keep
-- only the RPCs that authenticated application users are intended to call.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.has_role(public.user_role) from public, anon, authenticated;

revoke all on function public.enroll_course(bigint) from public, anon;
revoke all on function public.submit_exercise(bigint, jsonb) from public, anon;
grant execute on function public.enroll_course(bigint) to authenticated;
grant execute on function public.submit_exercise(bigint, jsonb) to authenticated;

-- Evaluate auth.uid() once per statement rather than once per row.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Users can update own username" on public.profiles;
create policy "Users can update own username" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Learners can view own enrollments" on public.course_enrollments;
create policy "Learners can view own enrollments" on public.course_enrollments
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Learners can view own progress" on public.user_progress;
create policy "Learners can view own progress" on public.user_progress
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Learners can view own submissions" on public.submissions;
create policy "Learners can view own submissions" on public.submissions
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Learners can view own AI explanations" on public.ai_explanations;
create policy "Learners can view own AI explanations" on public.ai_explanations
  for select to authenticated
  using (
    exists (
      select 1
      from public.submissions
      where submissions.id = ai_explanations.submission_id
        and submissions.user_id = (select auth.uid())
    )
  );

drop policy if exists "Moderators and admins can view generated exercises" on public.generated_exercises;
create policy "Moderators and admins can view generated exercises"
  on public.generated_exercises for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role in ('moderator', 'admin')
    )
  );

drop policy if exists "Moderators and admins can insert generated exercises" on public.generated_exercises;
create policy "Moderators and admins can insert generated exercises"
  on public.generated_exercises for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role in ('moderator', 'admin')
    )
  );

drop policy if exists "Moderators and admins can update generated exercises" on public.generated_exercises;
create policy "Moderators and admins can update generated exercises"
  on public.generated_exercises for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role in ('moderator', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role in ('moderator', 'admin')
    )
  );

drop policy if exists "Moderators and admins can view exercise reviews" on public.exercise_reviews;
create policy "Moderators and admins can view exercise reviews"
  on public.exercise_reviews for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role in ('moderator', 'admin')
    )
  );

drop policy if exists "Moderators and admins can insert exercise reviews" on public.exercise_reviews;
create policy "Moderators and admins can insert exercise reviews"
  on public.exercise_reviews for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role in ('moderator', 'admin')
    )
  );

drop policy if exists "Admins can view admin logs" on public.admin_logs;
create policy "Admins can view admin logs"
  on public.admin_logs for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role = 'admin'
    )
  );

-- Cover every foreign key reported by the Cloud performance advisor.
create index if not exists idx_submissions_exercise_id
  on public.submissions(exercise_id);
create index if not exists idx_generated_exercises_requested_by
  on public.generated_exercises(requested_by);
create index if not exists idx_exercise_reviews_reviewer_id
  on public.exercise_reviews(reviewer_id);
create index if not exists source_documents_uploaded_by_idx
  on public.source_documents(uploaded_by);
create index if not exists lesson_drafts_source_document_idx
  on public.lesson_drafts(source_document_id);
create index if not exists lesson_drafts_chapter_idx
  on public.lesson_drafts(chapter_id);
create index if not exists lesson_drafts_target_lesson_idx
  on public.lesson_drafts(target_lesson_id);
create index if not exists lesson_drafts_requested_by_idx
  on public.lesson_drafts(requested_by);
create index if not exists lesson_draft_citations_document_chunk_idx
  on public.lesson_draft_citations(document_chunk_id);
create index if not exists lesson_draft_reviews_reviewer_idx
  on public.lesson_draft_reviews(reviewer_id);
create index if not exists lesson_draft_publications_source_document_idx
  on public.lesson_draft_publications(source_document_id);
create index if not exists lesson_draft_publications_course_idx
  on public.lesson_draft_publications(course_id);
create index if not exists lesson_draft_publications_lesson_idx
  on public.lesson_draft_publications(lesson_id);
create index if not exists lesson_draft_publications_published_by_idx
  on public.lesson_draft_publications(published_by);
