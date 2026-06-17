import Link from "next/link";
import type { PostData } from "@/lib/posts";

interface BacklinksProps {
  posts: PostData[];
}

export default function Backlinks({ posts }: BacklinksProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-4 text-lg font-medium text-foreground">提到这篇的文章</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card-hover"
          >
            <div className="text-sm font-medium text-foreground">{post.title}</div>
            <div className="mt-1 text-xs text-muted">{post.date}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
