"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center">
      <p className="font-display text-6xl font-normal tracking-tight text-accent">出错了</p>
      <h1 className="mt-4 font-display text-2xl font-normal tracking-tight text-foreground">
        页面加载失败
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        渲染这个页面时发生了意外错误，可以尝试重新加载。
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:bg-accent"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          重试
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
