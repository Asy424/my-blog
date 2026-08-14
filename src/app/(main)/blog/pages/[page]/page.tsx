import { notFound } from "next/navigation";
import { getSortedPostsData } from "@/lib/posts";
import Pagination from "@/components/Pagination";
import PostList from "../../_components/PostList";
import { getPagePosts, getTotalPages } from "@/lib/pagination";

interface BlogPagePageProps {
  params: Promise<{ page: string }>;
}

export function generateStaticParams() {
  const posts = getSortedPostsData();
  const totalPages = getTotalPages(posts.length);
  // 至少返回第 1 页（内容与 /blog 相同，canonical 指回 /blog），
  // 避免静态导出对空 generateStaticParams 报错；文章超过一页时自动生成后续页
  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1),
  }));
}

export async function generateMetadata({ params }: BlogPagePageProps) {
  const { page } = await params;
  return {
    title: `第 ${page} 页`,
    description: `博客文章列表第 ${page} 页`,
    alternates: {
      canonical: page === "1" ? "/blog" : `/blog/pages/${page}`,
    },
  };
}

export default async function BlogPagePage({ params }: BlogPagePageProps) {
  const { page: rawPage } = await params;
  const page = Number(rawPage);
  const posts = getSortedPostsData();
  const totalPages = getTotalPages(posts.length);

  if (!Number.isInteger(page) || page < 1 || page > totalPages) {
    notFound();
  }

  const pagePosts = getPagePosts(posts, page);

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
          按发布时间倒序排列的全部公开文章。第 {page} / {totalPages} 页
        </p>
      </header>
      <PostList posts={pagePosts} />
      <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}
