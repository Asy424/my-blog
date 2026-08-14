import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** 列表基础路径，如 "/blog"；第 1 页用 basePath，其余用 basePath/pages/N */
  basePath: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function href(page: number) {
    return page === 1 ? basePath : `${basePath}/pages/${page}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="分页">
      {currentPage > 1 && (
        <Link
          href={href(currentPage - 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          上一页
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={href(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={[
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            page === currentPage
              ? "bg-foreground font-medium text-background"
              : "border border-border text-muted hover:border-accent hover:text-accent",
          ].join(" ")}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={href(currentPage + 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          下一页
        </Link>
      )}
    </nav>
  );
}
