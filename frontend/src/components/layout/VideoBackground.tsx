'use client';

import { useState } from 'react';

export function VideoBackground() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Placeholder: gradiente escuro enquanto o vídeo carrega */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-atomic-dark via-[#2a2a28] to-[#1a1a18] transition-opacity duration-700 ${
          loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />

      <iframe
        src="https://player.vimeo.com/video/1039035736?muted=1&autoplay=1&loop=1&background=1&app_id=122963"
        className={`absolute top-1/2 right-0 -translate-y-1/2 h-screen w-[177.78vh] pointer-events-none transition-opacity duration-1000 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        allow="autoplay; fullscreen; picture-in-picture"
        title="Atomic Group background"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
