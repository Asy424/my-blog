import PostCard from "@/components/PostCard";
import type { PostData } from "@/lib/posts";

export default function PostList({ posts }: { posts: PostData[] }) {
  if (posts.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center text-muted">
        <p className="text-lg">还没有文章</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {posts.map((post, i) => (
        <div key={post.slug} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}>
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
