import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/account(.*)',
  '/watch/(.*)',
  '/admin(.*)',
  '/api/checkout',
  '/api/billing-portal',
  '/api/stream/sign',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};
