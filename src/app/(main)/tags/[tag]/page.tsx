import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import PostCard from "@/components/PostCard";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  return {
    title: `标签: ${decodedTag}`,
    description: `标签 "${decodedTag}" 下的所有文章`,
    alternates: {
      canonical: `/tags/${encodeURIComponent(decodedTag)}`,
    },
  };
}

export function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({
    tag: String(tag),
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
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="animate-fade-in-up">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
          标签: {tag}
        </h1>
        <p className="mt-2 text-muted">
          共 {posts.length} 篇文章
        </p>
      </header>
      <div className="mt-8 space-y-4">
        {posts.map((post, i) => (
          <div key={post.slug} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}>
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
