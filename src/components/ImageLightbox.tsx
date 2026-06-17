"use client";

import { useEffect, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface LightboxImage {
  src: string;
  alt: string;
}

export default function ImageLightbox() {
  const [image, setImage] = useState<LightboxImage | null>(null);

  useEffect(() => {
    const article = document.querySelector(".prose");
    if (!article) return;

    function getImage(target: EventTarget | null) {
      return target instanceof Element
        ? target.closest<HTMLImageElement>(".prose img")
        : null;
    }

    function openImage(img: HTMLImageElement) {
      setImage({
        src: img.currentSrc || img.src,
        alt: img.alt || "文章图片",
      });
    }

    function handleClick(event: Event) {
      const img = getImage(event.target);
      if (img) openImage(img);
    }

    function handleKeyDown(event: Event) {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const img = getImage(event.target);
      if (img) {
        event.preventDefault();
        openImage(img);
      }
    }

    const images = Array.from(article.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((img) => {
      if (!img.hasAttribute("tabindex")) img.tabIndex = 0;
      img.classList.add("article-lightbox-image");
    });

    article.addEventListener("click", handleClick);
    article.addEventListener("keydown", handleKeyDown);

    return () => {
      article.removeEventListener("click", handleClick);
      article.removeEventListener("keydown", handleKeyDown);
      images.forEach((img) => {
        img.classList.remove("article-lightbox-image");
      });
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
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [image]);

  useScrollLock(Boolean(image));

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
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
