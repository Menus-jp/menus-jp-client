"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Photo {
  id: string;
  image: string;
  alt?: string;
}

interface BusinessPhotoCarouselProps {
  photos: Photo[];
  businessName: string;
  heroSrc?: string | null;
  category?: string;
  address?: string;
  className?: string;
  fillContainer?: boolean;
  showIdentity?: boolean;
}

export default function BusinessPhotoCarousel({
  photos,
  businessName,
  heroSrc,
  category,
  address,
  className,
  fillContainer = false,
  showIdentity = true,
}: BusinessPhotoCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback(
    (index: number, dir: "left" | "right") => {
      if (animating || photos.length <= 1) return;
      setDirection(dir);
      setPrev(current);
      setCurrent(index);
      setAnimating(true);
      setTimeout(() => {
        setPrev(null);
        setAnimating(false);
      }, 420);
    },
    [animating, current, photos.length]
  );

  const next = useCallback(() => {
    go((current + 1) % photos.length, "right");
  }, [current, go, photos.length]);

  const goTo = (index: number) => {
    if (index === current) return;
    go(index, index > current ? "right" : "left");
  };

  useEffect(() => {
    if (paused || photos.length <= 1) return;
    timerRef.current = setTimeout(next, 3800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, paused, next, photos.length]);

  const slideIn =
    direction === "right"
      ? "translate-x-full opacity-0"
      : "-translate-x-full opacity-0";
  const slideOut =
    direction === "right"
      ? "-translate-x-full opacity-0"
      : "translate-x-full opacity-0";

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={["relative w-full select-none overflow-hidden rounded-2xl bg-neutral-900", className]
        .filter(Boolean)
        .join(" ")}
      style={fillContainer ? undefined : { aspectRatio: "16/9" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {photos.length > 0 ? (
        <>
          {/* Fallback: show current photo as background to prevent black screen */}
          <div className="absolute inset-0 z-0">
            <img
              src={photos[current]?.image}
              alt={photos[current]?.alt ?? `${businessName} photo`}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Animated carousel images */}
          {photos.map((photo, i) => {
            const isActive = i === current;
            const isPrev = i === prev;
            if (!isActive && !isPrev) return null;
            return (
              <div
                key={photo.id}
                className={[
                  "absolute inset-0 z-10 transition-all duration-[420ms] ease-[cubic-bezier(0.77,0,0.18,1)]",
                  isActive && animating ? slideIn : "",
                  isActive && !animating ? "translate-x-0 opacity-100" : "",
                  isPrev ? slideOut : "",
                ].join(" ")}
              >
                <img
                  src={photo.image}
                  alt={photo.alt ?? `${businessName} photo ${i + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            );
          })}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
          <span className="text-4xl font-black tracking-tight text-white/20">
            {initials}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />

      {!paused && photos.length > 1 && (
        <div className="absolute top-0 left-0 right-0 z-20 h-[2px] bg-white/10">
          <div
            key={current}
            className="h-full bg-white/70"
            style={{ animation: "carousel-progress 3.8s linear forwards" }}
          />
        </div>
      )}

      {showIdentity && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between px-3.5 pb-12.5">

          <div className="flex items-center gap-2.5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-white/20 bg-neutral-700 shadow-lg">
              {heroSrc ? (
                <img
                  src={heroSrc}
                  alt={businessName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-600">
                  <span className="text-xs font-black text-white/70">{initials}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <p className="text-3xl font-bold leading-tight text-white drop-shadow">
                {businessName}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {category && (
                  <span className="rounded-md bg-white/15 px-1.5 py-px text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                    {category}
                  </span>
                )}
                {address && (
                  <span className="flex items-center gap-0.5 text-[10px] text-white/60">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M4.5 1C3.12 1 2 2.12 2 3.5c0 2 2.5 4.5 2.5 4.5S7 5.5 7 3.5C7 2.12 5.88 1 4.5 1Zm0 3.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" fill="currentColor"/>
                    </svg>
                    <span className="line-clamp-1 max-w-[140px]">{address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes carousel-progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
