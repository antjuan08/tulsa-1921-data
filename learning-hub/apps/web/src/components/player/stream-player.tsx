'use client';

// Cloudflare Stream's iframe player. Takes either a signed token or a raw video UID.
// For seeded demo videos with unsigned playback, passing the UID directly works.
export function StreamPlayer({
  uidOrToken,
  poster,
  autoplay = false,
  className,
}: {
  uidOrToken: string;
  poster?: string;
  autoplay?: boolean;
  className?: string;
}) {
  const params = new URLSearchParams();
  if (poster) params.set('poster', poster);
  if (autoplay) params.set('autoplay', 'true');
  params.set('preload', 'metadata');
  const src = `https://iframe.videodelivery.net/${uidOrToken}?${params.toString()}`;
  return (
    <div className={className}>
      <iframe
        src={src}
        title="Lesson player"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
