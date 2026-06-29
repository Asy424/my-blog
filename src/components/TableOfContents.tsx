"use client";

import { useEffect, useRef, useState } from "react";

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  headings: TocHeading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    activeLinkRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeId]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 border-l border-border pl-5 text-sm">
      <div className="mb-3 font-medium text-foreground/80 tracking-wide text-xs uppercase">
        目录
      </div>
      <ol className="toc-scroll max-h-[calc(100vh-8rem)] space-y-1.5 overflow-y-auto pr-3">
        {headings.map((heading) => {
          const isActive = heading.id === activeId;
          return (
            <li
              key={heading.id}
              className={heading.level === 3 ? "pl-4" : undefined}
            >
              <a
                ref={isActive ? activeLinkRef : null}
                href={`#${heading.id}`}
                className={`block py-0.5 transition-colors duration-200 border-l-2 -ml-5 pl-5 ${
                  isActive
                    ? "border-accent text-accent font-medium"
                    : "border-transparent text-muted hover:text-foreground hover:border-border"
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
