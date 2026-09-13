import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  primaryKey,
  uuid,
  index,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);
export const lessonStatusEnum = pgEnum('lesson_status', ['processing', 'ready', 'failed']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);
export const planEnum = pgEnum('plan', ['monthly', 'annual']);

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  name: text('name'),
  imageUrl: text('image_url'),
  role: userRoleEnum('role').notNull().default('member'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const instructors = pgTable('instructors', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  headline: text('headline').notNull(),
  bio: text('bio').notNull(),
  heroImageUrl: text('hero_image_url').notNull(),
  portraitImageUrl: text('portrait_image_url'),
  trailerStreamUid: text('trailer_stream_uid'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
});

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => instructors.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    heroImageUrl: text('hero_image_url').notNull(),
    posterImageUrl: text('poster_image_url').notNull(),
    trailerStreamUid: text('trailer_stream_uid'),
    durationMinutes: integer('duration_minutes').notNull().default(0),
    lessonCount: integer('lesson_count').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    instructorIdx: index('courses_instructor_idx').on(t.instructorId),
    categoryIdx: index('courses_category_idx').on(t.categoryId),
    publishedIdx: index('courses_published_idx').on(t.publishedAt),
  }),
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    streamUid: text('stream_uid').notNull(),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    status: lessonStatusEnum('status').notNull().default('ready'),
    isFreePreview: boolean('is_free_preview').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    courseIdx: index('lessons_course_idx').on(t.courseId, t.order),
  }),
);

export const subscriptions = pgTable('subscriptions', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  status: subscriptionStatusEnum('status').notNull(),
  plan: planEnum('plan').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const watchProgress = pgTable(
  'watch_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    positionSeconds: integer('position_seconds').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.lessonId] }),
    userIdx: index('watch_progress_user_idx').on(t.userId, t.updatedAt),
  }),
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    body: text('body'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    courseIdx: index('reviews_course_idx').on(t.courseId),
  }),
);

export type User = typeof users.$inferSelect;
export type Instructor = typeof instructors.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type WatchProgress = typeof watchProgress.$inferSelect;
export type Review = typeof reviews.$inferSelect;
