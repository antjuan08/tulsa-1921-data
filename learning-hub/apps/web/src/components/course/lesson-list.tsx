import Link from 'next/link';
import { Play, Lock } from 'lucide-react';
import type { Lesson } from '@ott/db';
import { formatDuration, cn } from '@/lib/utils';

export function LessonList({
  lessons,
  entitled,
  currentLessonId,
}: {
  lessons: Lesson[];
  entitled: boolean;
  currentLessonId?: string;
}) {
  return (
    <ol className="overflow-hidden rounded-xl border border-white/5">
      {lessons.map((lesson, i) => {
        const playable = entitled || lesson.isFreePreview;
        const isCurrent = currentLessonId === lesson.id;
        return (
          <li
            key={lesson.id}
            className={cn(
              'border-b border-white/5 last:border-b-0',
              isCurrent ? 'bg-[var(--color-bg-elevated)]' : 'bg-[var(--color-bg-surface)]',
            )}
          >
            <Link
              href={playable ? `/watch/${lesson.id}` : '/pricing'}
              className="flex items-center gap-5 p-5 transition hover:bg-white/[0.03]"
            >
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white/5 text-sm text-[var(--color-fg-secondary)]">
                {playable ? (
                  <Play size={16} className="ml-0.5 text-white" />
                ) : (
                  <Lock size={16} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
                    Lesson {String(i + 1).padStart(2, '0')}
                  </span>
                  {lesson.isFreePreview && (
                    <span className="rounded bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                      Free preview
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base text-white">{lesson.title}</div>
                {lesson.description && (
                  <div className="mt-1 line-clamp-1 text-sm text-[var(--color-fg-secondary)]">
                    {lesson.description}
                  </div>
                )}
              </div>
              <div className="text-sm text-[var(--color-fg-secondary)]">
                {formatDuration(lesson.durationSeconds)}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
