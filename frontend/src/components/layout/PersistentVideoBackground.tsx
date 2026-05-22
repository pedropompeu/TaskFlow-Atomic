export function PersistentVideoBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-atomic-ice pointer-events-none">
      <iframe
        src="https://player.vimeo.com/video/1039035736?muted=1&autoplay=1&loop=1&background=1&app_id=122963"
        className="absolute top-1/2 right-0 -translate-y-1/2 h-screen w-[177.78vh] pointer-events-none"
        allow="autoplay; fullscreen; picture-in-picture"
        title="Atomic Group background"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-atomic-dark/80 via-atomic-dark/25 to-transparent pointer-events-none" />
    </div>
  );
}
