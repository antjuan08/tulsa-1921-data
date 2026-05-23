import type {
  Category,
  Course,
  Instructor,
  Lesson,
  Subscription,
  User,
  WatchProgress,
  Review,
} from '@ott/db';

export type { Category, Course, Instructor, Lesson, Subscription, User, WatchProgress, Review };

export type CourseWithRelations = Course & {
  instructor: Instructor;
  category: Category;
  lessons: Lesson[];
};

export type LessonWithCourse = Lesson & {
  course: Course & { instructor: Instructor };
};

export type Entitlement = {
  active: boolean;
  plan: 'monthly' | 'annual' | null;
  currentPeriodEnd: Date | null;
};

export type SignedPlaybackResponse = {
  uid: string;
  token: string;
  expiresAt: number;
};
