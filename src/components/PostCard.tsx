import Link from "next/link";
import type { PostData } from "@/lib/posts";
import TagBadge from "./TagBadge";

interface PostCardProps {
  post: PostData;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <Link href={`/blog/${post.slug}`}>
        <h2 className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {post.title}
        </h2>
      </Link>
      <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <time dateTime={post.date}>{post.date}</time>
      </div>
      <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
        {post.description}
      </p>
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
