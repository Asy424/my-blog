import Link from "next/link";
import type { PostData } from "@/lib/posts";
import TagBadge from "./TagBadge";

interface PostCardProps {
  post: PostData;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:border-accent hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
              {post.title}
            </h2>
          </Link>
          <p className="mt-2 text-sm leading-6 text-muted">
            {post.description || "这篇文章还没有摘要。"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-sm text-muted">
          <time dateTime={post.date}>{post.date}</time>
          {post.readingTime && (
            <>
              <span className="text-border">·</span>
              <span>{post.readingTime} 分钟</span>
            </>
          )}
        </div>
      </div>
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
