import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  count?: number;
}

export default function TagBadge({ tag, count }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {tag}
      {count !== undefined && (
        <span className="text-xs text-gray-400 dark:text-gray-500">({count})</span>
      )}
    </Link>
  );
}
