-- Document-to-Lesson creates unpublished curriculum through protected RPCs.
-- Keep public visibility publish-only while allowing active Admin sessions to
-- inspect all curriculum rows needed by the review pipeline.

drop policy if exists "Active admins can view all courses" on public.courses;
create policy "Active admins can view all courses"
  on public.courses for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role = 'admin'
    )
  );

drop policy if exists "Active admins can view all chapters" on public.chapters;
create policy "Active admins can view all chapters"
  on public.chapters for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role = 'admin'
    )
  );

drop policy if exists "Active admins can view all lessons" on public.lessons;
create policy "Active admins can view all lessons"
  on public.lessons for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role = 'admin'
    )
  );
