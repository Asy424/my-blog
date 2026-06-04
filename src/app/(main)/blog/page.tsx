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
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
          全部笔记
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
          文章
        </h1>
        <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-400">
          按发布时间倒序排列的全部公开文章。
        </p>
      </header>
      {posts.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-slate-700 dark:text-gray-400">
          <p className="text-lg">还没有文章</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
