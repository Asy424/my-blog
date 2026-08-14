import Link from "next/link";

export const metadata = {
  title: "页面不存在",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center">
      <p className="font-display text-7xl font-normal tracking-tight text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-normal tracking-tight text-foreground">
        页面不存在
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        你访问的页面可能已被移动或删除，也可能从未存在过。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:bg-accent"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        返回首页
      </Link>
    </div>
  );
}
