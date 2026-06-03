"use client";

import { useEffect, useState } from "react";

interface LightboxImage {
  src: string;
  alt: string;
}

export default function ImageLightbox() {
  const [image, setImage] = useState<LightboxImage | null>(null);

  useEffect(() => {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>(".prose img"));
    const cleanups: Array<() => void> = [];

    images.forEach((img) => {
      img.tabIndex = 0;
      img.style.cursor = "zoom-in";

      const open = () => {
        setImage({
          src: img.currentSrc || img.src,
          alt: img.alt || "文章图片",
        });
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      };

      img.addEventListener("click", open);
      img.addEventListener("keydown", handleKeyDown);

      cleanups.push(() => {
        img.removeEventListener("click", open);
        img.removeEventListener("keydown", handleKeyDown);
        img.removeAttribute("tabindex");
        img.style.cursor = "";
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (!image) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImage(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [image]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={() => setImage(null)}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
        onClick={() => setImage(null)}
      >
        关闭
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
