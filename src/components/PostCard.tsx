import Link from "next/link";
import type { PostData } from "@/lib/posts";
import TagBadge from "./TagBadge";

interface PostCardProps {
  post: PostData;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group rounded-lg border border-gray-200/80 bg-white/80 p-5 shadow-sm shadow-gray-200/40 transition-colors hover:border-blue-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-none dark:hover:border-blue-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-lg font-semibold leading-snug text-gray-950 transition-colors group-hover:text-blue-600 dark:text-gray-50 dark:group-hover:text-blue-300">
              {post.title}
            </h2>
          </Link>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {post.description || "这篇文章还没有摘要。"}
          </p>
        </div>
        <time
          dateTime={post.date}
          className="shrink-0 text-sm text-gray-400 dark:text-gray-500"
        >
          {post.date}
        </time>
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
