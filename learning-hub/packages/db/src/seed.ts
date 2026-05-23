import 'dotenv/config';
import { db, categories, instructors, courses, lessons } from './index';
import { eq } from 'drizzle-orm';

// Cloudflare's public demo video UIDs — these play in-browser without auth, so the
// seeded catalog is immediately watchable in the dev app.
const DEMO_VIDEOS = {
  trailerA: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI4NWY4', // placeholder; using shorts below
  // Cloudflare hosts these as part of their docs/demos:
  short1: '5d5bc37ffcf54c9b82e996823bffbb81', // Cloudflare sample
  short2: 'a82e1da1ba3d2c6c7f78fcaad7cd60ce',
  short3: '31c9291ab41fac05471db4e73aa11717',
  short4: 'ea95132c15732412d22c1476fa83f27a',
} as const;

const FALLBACK_VIDEO = '5d5bc37ffcf54c9b82e996823bffbb81';

async function main() {
  console.log('🌱 Seeding learning-hub database...');

  // Categories
  const [filmmaking] = await db
    .insert(categories)
    .values({ slug: 'filmmaking', name: 'Filmmaking', description: 'Lights. Camera. Vision.' })
    .onConflictDoUpdate({
      target: categories.slug,
      set: { name: 'Filmmaking' },
    })
    .returning();

  const [music] = await db
    .insert(categories)
    .values({ slug: 'music', name: 'Music', description: 'Write, perform, produce.' })
    .onConflictDoUpdate({
      target: categories.slug,
      set: { name: 'Music' },
    })
    .returning();

  if (!filmmaking || !music) throw new Error('Failed to seed categories');

  // Instructors
  const [ava] = await db
    .insert(instructors)
    .values({
      slug: 'ava-okonkwo',
      name: 'Ava Okonkwo',
      headline: 'Cinematographer of "Quiet Light" — Cannes Camera d\'Or 2023',
      bio: 'Ava Okonkwo built her career shooting on hand-cranked 16mm in West Africa before moving to large-format digital. In this class, she breaks down the visual language behind her award-winning features and shows you how to compose images that feel both intimate and monumental.',
      heroImageUrl:
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=2400&q=80&auto=format&fit=crop',
      portraitImageUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop',
      trailerStreamUid: FALLBACK_VIDEO,
    })
    .onConflictDoUpdate({
      target: instructors.slug,
      set: { name: 'Ava Okonkwo' },
    })
    .returning();

  const [marcus] = await db
    .insert(instructors)
    .values({
      slug: 'marcus-reyes',
      name: 'Marcus Reyes',
      headline: 'Grammy-winning songwriter behind three #1 albums',
      bio: 'Marcus Reyes has written for everyone from indie folk newcomers to arena pop superstars. In this class, he walks you through his songwriting process — from the spark of a lyric idea to a finished, recorded demo — using only a notebook, a guitar, and a single microphone.',
      heroImageUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=2400&q=80&auto=format&fit=crop',
      portraitImageUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop',
      trailerStreamUid: FALLBACK_VIDEO,
    })
    .onConflictDoUpdate({
      target: instructors.slug,
      set: { name: 'Marcus Reyes' },
    })
    .returning();

  if (!ava || !marcus) throw new Error('Failed to seed instructors');

  // Courses
  const cinematicCourse = {
    slug: 'cinematic-photography',
    title: 'Cinematic Photography',
    tagline: 'Composition, light, and movement for the modern image-maker.',
    description:
      'Across 12 lessons, Ava deconstructs how she builds images that feel cinematic — from choosing a lens that flatters the human eye to lighting an interior at golden hour without a single artificial source. You\'ll come away with an instinct for the frame, not a checklist.',
    instructorId: ava.id,
    categoryId: filmmaking.id,
    heroImageUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=2400&q=80&auto=format&fit=crop',
    posterImageUrl:
      'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=1200&q=80&auto=format&fit=crop',
    trailerStreamUid: FALLBACK_VIDEO,
    durationMinutes: 184,
    lessonCount: 4,
    publishedAt: new Date(),
  };

  const songwritingCourse = {
    slug: 'modern-songwriting',
    title: 'Modern Songwriting',
    tagline: 'Build songs from a single line of melody — and finish them.',
    description:
      'Marcus walks you through the craft of writing songs that connect, from finding a melodic hook that won\'t leave you alone, to lyric editing, to recording a polished demo at your kitchen table. Includes downloadable worksheets and chord charts.',
    instructorId: marcus.id,
    categoryId: music.id,
    heroImageUrl:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=2400&q=80&auto=format&fit=crop',
    posterImageUrl:
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=80&auto=format&fit=crop',
    trailerStreamUid: FALLBACK_VIDEO,
    durationMinutes: 152,
    lessonCount: 4,
    publishedAt: new Date(),
  };

  const [cinematic] = await db
    .insert(courses)
    .values(cinematicCourse)
    .onConflictDoUpdate({
      target: courses.slug,
      set: cinematicCourse,
    })
    .returning();

  const [songwriting] = await db
    .insert(courses)
    .values(songwritingCourse)
    .onConflictDoUpdate({
      target: courses.slug,
      set: songwritingCourse,
    })
    .returning();

  if (!cinematic || !songwriting) throw new Error('Failed to seed courses');

  // Lessons — clear existing first so re-seeding produces a deterministic catalog
  await db.delete(lessons).where(eq(lessons.courseId, cinematic.id));
  await db.delete(lessons).where(eq(lessons.courseId, songwriting.id));

  await db.insert(lessons).values([
    {
      courseId: cinematic.id,
      order: 1,
      title: 'Introduction: The Cinematic Eye',
      description: 'What makes an image feel cinematic, and why most photos don\'t.',
      streamUid: DEMO_VIDEOS.short1,
      durationSeconds: 12 * 60,
      isFreePreview: true,
    },
    {
      courseId: cinematic.id,
      order: 2,
      title: 'Light: Reading the Room',
      description: 'How to find the one direction of light worth shooting in.',
      streamUid: DEMO_VIDEOS.short2,
      durationSeconds: 24 * 60,
    },
    {
      courseId: cinematic.id,
      order: 3,
      title: 'Composition: Frames Inside Frames',
      description: 'Layered compositions that pull the eye deep into the picture.',
      streamUid: DEMO_VIDEOS.short3,
      durationSeconds: 31 * 60,
    },
    {
      courseId: cinematic.id,
      order: 4,
      title: 'Movement: The Pan That Tells a Story',
      description: 'Why most camera movement fails — and how to make yours mean something.',
      streamUid: DEMO_VIDEOS.short4,
      durationSeconds: 28 * 60,
    },
  ]);

  await db.insert(lessons).values([
    {
      courseId: songwriting.id,
      order: 1,
      title: 'The Hook: Where Songs Begin',
      description: 'Finding the melodic seed that the rest of the song grows from.',
      streamUid: DEMO_VIDEOS.short1,
      durationSeconds: 18 * 60,
      isFreePreview: true,
    },
    {
      courseId: songwriting.id,
      order: 2,
      title: 'Lyrics: Edit Like a Poet',
      description: 'Cutting what doesn\'t serve the song.',
      streamUid: DEMO_VIDEOS.short2,
      durationSeconds: 22 * 60,
    },
    {
      courseId: songwriting.id,
      order: 3,
      title: 'Chord Progressions That Move',
      description: 'Beyond the four chords everyone uses.',
      streamUid: DEMO_VIDEOS.short3,
      durationSeconds: 35 * 60,
    },
    {
      courseId: songwriting.id,
      order: 4,
      title: 'Demo: One Mic, One Guitar',
      description: 'Recording a finished demo with nothing but what\'s on your desk.',
      streamUid: DEMO_VIDEOS.short4,
      durationSeconds: 27 * 60,
    },
  ]);

  console.log('✓ Seeded 2 categories, 2 instructors, 2 courses, 8 lessons.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
