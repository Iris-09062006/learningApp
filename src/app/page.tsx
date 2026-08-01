export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-text-primary">
      <section className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-8 shadow-sm sm:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
          Python Learning Platform
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Nền tảng đã sẵn sàng để xây dựng.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
          Next.js App Router, TypeScript strict mode và hệ thống design token
          đã được cấu hình làm nền tảng cho hành trình học Python.
        </p>
      </section>
    </main>
  );
}
