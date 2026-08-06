"use client";

import React, { useEffect, useRef, useState } from "react";

import type { ExerciseOption } from "@/features/exercises/types";

interface FixTheBugDragDropProps {
  options: ExerciseOption[];
  value: number | null;
  onChange: (optionId: number | null) => void;
}

export const FixTheBugDragDrop: React.FC<FixTheBugDragDropProps> = ({
  options,
  value,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const announceTimerRef = useRef<number | null>(null);

  const selectedOption = options.find((option) => option.id === value) ?? null;
  const availableOptions = options.filter((option) => option.id !== value);

  useEffect(() => {
    return () => {
      if (announceTimerRef.current !== null) {
        window.clearTimeout(announceTimerRef.current);
      }
    };
  }, []);

  function announce(message: string): void {
    setAnnouncement(message);
    if (announceTimerRef.current !== null) {
      window.clearTimeout(announceTimerRef.current);
    }
    announceTimerRef.current = window.setTimeout(() => setAnnouncement(""), 3000);
  }

  function selectOption(option: ExerciseOption): void {
    onChange(option.id);
    announce(`Đã chọn mảnh code “${option.content}” vào vị trí trống.`);
  }

  function clearOption(): void {
    if (selectedOption) {
      announce(`Đã gỡ bỏ mảnh code “${selectedOption.content}”. Vị trí trống.`);
    }
    onChange(null);
    optionsRef.current?.focus();
  }

  function focusOptions(): void {
    optionsRef.current?.focus();
  }

  function handleDragStart(
    event: React.DragEvent<HTMLButtonElement>,
    option: ExerciseOption
  ): void {
    event.dataTransfer.setData("text/plain", String(option.id));
    event.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    announce(`Đang kéo mảnh code “${option.content}”.`);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>): void {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragOver(false);
    setIsDragging(false);

    const rawId = event.dataTransfer.getData("text/plain");
    const id = Number.parseInt(rawId, 10);
    const option = options.find((candidate) => candidate.id === id);

    if (option) {
      onChange(option.id);
      announce(`Đã bỏ mảnh code “${option.content}” vào vị trí trống.`);
    } else {
      announce("Không thể bỏ mảnh code vào vị trí này.");
    }
  }

  function handleDragEnd(): void {
    setIsDragging(false);
    setIsDragOver(false);
  }

  return (
    <div data-testid="fix-the-bug-drag-drop" className="space-y-4">
      {/* Drop zone */}
      <div
        data-testid="drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "rounded-xl border-2 border-dashed p-4 transition-colors duration-200",
          isDragOver
            ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950"
            : "border-slate-300 dark:border-slate-700",
        ].join(" ")}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Vị trí trống — kéo mảnh code vào đây
        </p>

        {selectedOption ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <code className="rounded-lg bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-emerald-300">
              {selectedOption.content}
            </code>
            <button
              type="button"
              onClick={clearOption}
              className="shrink-0 cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:text-slate-300 dark:hover:border-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              Gỡ bỏ
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={focusOptions}
            className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm text-slate-500 transition-colors duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
          >
            Chọn mảnh code ở bên dưới để điền vào vị trí này
          </button>
        )}
      </div>

      {/* Options list */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Các mảnh code
        </p>

        {availableOptions.length === 0 ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Đã đặt tất cả mảnh code. Nhấn “Gỡ bỏ” nếu muốn đổi lựa chọn.
          </p>
        ) : (
          <div
            ref={optionsRef}
            tabIndex={-1}
            className={[
              "mt-3 grid gap-3 sm:grid-cols-2",
              isDragging ? "opacity-60" : "",
            ].join(" ")}
          >
            {availableOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                draggable
                onClick={() => selectOption(option)}
                onDragStart={(event) => handleDragStart(event, option)}
                onDragEnd={handleDragEnd}
                aria-label={`Mảnh code: ${option.content}`}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
              >
                <code className="font-mono text-sm leading-6 text-slate-200">
                  {option.content}
                </code>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live announcements for screen readers */}
      <div
        aria-live="polite"
        role="status"
        className="sr-only"
        data-testid="drag-drop-announcer"
      >
        {announcement}
      </div>
    </div>
  );
};