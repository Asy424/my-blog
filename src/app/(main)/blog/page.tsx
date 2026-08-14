import { getSortedPostsData } from "@/lib/posts";
import Pagination from "@/components/Pagination";
import PostList from "./_components/PostList";
import { getPagePosts, getTotalPages } from "@/lib/pagination";

export const metadata = {
  title: "博客",
  description: "所有博客文章列表",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const posts = getSortedPostsData();
  const totalPages = getTotalPages(posts.length);
  const pagePosts = getPagePosts(posts, 1);

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
      <PostList posts={pagePosts} />
      <Pagination currentPage={1} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}
