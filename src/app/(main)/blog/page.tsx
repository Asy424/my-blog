import { getSortedPostsData } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export const metadata = {
  title: "博客",
  description: "所有博客文章列表",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const posts = getSortedPostsData();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="max-w-3xl animate-fade-in-up">
        <p className="text-sm font-medium text-accent tracking-wide">
          全部笔记
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tight text-foreground">
          文章
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          按发布时间倒序排列的全部公开文章。
        </p>
      </header>
      {posts.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center text-muted">
          <p className="text-lg">还没有文章</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {posts.map((post, i) => (
            <div key={post.slug} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
