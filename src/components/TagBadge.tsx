import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  count?: number;
}

export default function TagBadge({ tag, count }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent-soft text-accent hover:opacity-80 transition-opacity"
    >
      {tag}
      {count !== undefined && (
        <span className="text-muted ml-0.5">({count})</span>
      )}
    </Link>
  );
}
