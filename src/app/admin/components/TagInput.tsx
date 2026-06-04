"use client";

import { useState, useCallback } from "react";

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");

  const tags = value
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const addTag = useCallback(
    (tag: string) => {
      const clean = tag.trim();
      if (!clean || tags.includes(clean)) return;
      const next = [...tags, clean].join(", ");
      onChange(next);
      setInput("");
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (tag: string) => {
      const next = tags.filter((t) => t !== tag).join(", ");
      onChange(next);
    },
    [tags, onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 hover:opacity-60 transition-opacity cursor-pointer"
            aria-label={`移除标签 ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder || "输入标签，回车添加" : ""}
        className="flex-1 min-w-[80px] bg-transparent outline-none text-sm text-foreground placeholder-muted py-0.5"
      />
    </div>
  );
}
