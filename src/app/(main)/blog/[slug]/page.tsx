import { notFound } from "next/navigation";
import { remark } from "remark";
import html from "remark-html";
import { getPostBySlug, getSortedPostsData } from "@/lib/posts";
import TagBadge from "@/components/TagBadge";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "文章未找到" };
  return {
    title: post.title,
    description: post.description,
  };
}

export function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const processedContent = await remark().use(html).process(post.content || "");
  const contentHtml = processedContent.toString();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <time dateTime={post.date}>{post.date}</time>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </header>
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </article>
  );
}
