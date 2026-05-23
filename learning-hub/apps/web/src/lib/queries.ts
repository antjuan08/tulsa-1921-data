import { db, courses, instructors, categories, lessons, watchProgress } from '@ott/db';
import { desc, eq, and, asc } from 'drizzle-orm';

export async function listPublishedCourses() {
  return db
    .select({
      course: courses,
      instructor: instructors,
      category: categories,
    })
    .from(courses)
    .innerJoin(instructors, eq(courses.instructorId, instructors.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .orderBy(desc(courses.publishedAt));
}

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCourseBySlug(slug: string) {
  const [row] = await db
    .select({
      course: courses,
      instructor: instructors,
      category: categories,
    })
    .from(courses)
    .innerJoin(instructors, eq(courses.instructorId, instructors.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.slug, slug))
    .limit(1);

  if (!row) return null;

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, row.course.id))
    .orderBy(asc(lessons.order));

  return { ...row, lessons: courseLessons };
}

export async function getLessonWithCourse(lessonId: string) {
  const [row] = await db
    .select({
      lesson: lessons,
      course: courses,
      instructor: instructors,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .innerJoin(instructors, eq(courses.instructorId, instructors.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);

  return row ?? null;
}

export async function listCoursesByCategory(categorySlug: string) {
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);
  if (!cat) return { category: null, items: [] as Awaited<ReturnType<typeof listPublishedCourses>> };
  const items = await db
    .select({
      course: courses,
      instructor: instructors,
      category: categories,
    })
    .from(courses)
    .innerJoin(instructors, eq(courses.instructorId, instructors.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.categoryId, cat.id))
    .orderBy(desc(courses.publishedAt));
  return { category: cat, items };
}

export async function getContinueWatching(userId: string, limit = 8) {
  return db
    .select({
      progress: watchProgress,
      lesson: lessons,
      course: courses,
      instructor: instructors,
    })
    .from(watchProgress)
    .innerJoin(lessons, eq(watchProgress.lessonId, lessons.id))
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .innerJoin(instructors, eq(courses.instructorId, instructors.id))
    .where(and(eq(watchProgress.userId, userId), eq(watchProgress.completed, false)))
    .orderBy(desc(watchProgress.updatedAt))
    .limit(limit);
}
