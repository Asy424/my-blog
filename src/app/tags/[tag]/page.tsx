import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import PostCard from "@/components/PostCard";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = await params;
  return {
    title: `标签: ${decodeURIComponent(tag)}`,
    description: `标签 "${decodeURIComponent(tag)}" 下的所有文章`,
  };
}

export function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({
    tag,
  }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const tags = getAllTags();

  if (!tags.includes(tag)) {
    notFound();
  }

  const posts = getPostsByTag(tag);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        标签: {tag}
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        共 {posts.length} 篇文章
      </p>
      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
