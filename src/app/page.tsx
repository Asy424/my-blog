import { getSortedPostsData } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export default function Home() {
  const posts = getSortedPostsData();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <section className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight">你好，欢迎来到我的博客</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          这里记录我的技术探索、编程心得和生活思考。用文字沉淀知识，用分享促进成长。
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">最新文章</h2>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-lg">还没有文章</p>
            <p className="mt-2">敬请期待！</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
