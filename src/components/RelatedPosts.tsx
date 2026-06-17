import PostCard from "./PostCard";
import type { PostData } from "@/lib/posts";

interface RelatedPostsProps {
  posts: PostData[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border pt-8">
      <h2 className="mb-4 font-display text-2xl font-normal tracking-tight text-foreground">
        相关文章
      </h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
