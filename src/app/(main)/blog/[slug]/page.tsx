import { notFound } from "next/navigation";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import { getPostBySlug, getSortedPostsData } from "@/lib/posts";
import TagBadge from "@/components/TagBadge";
import CodeBlock from "@/components/CodeBlock";

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
  const posts = getSortedPostsData(true); // 包含私密，确保私密文章也能生成页面
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

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, {
      theme: "one-dark-pro",
    })
    .use(rehypeStringify)
    .process(post.content || "");
  let contentHtml = processedContent.toString();
  // 把 ./xxx.md 链接转为博客 URL
  const basePath = "/my-blog/blog";
  contentHtml = contentHtml.replace(
    /href="\.\/([^"]+\.md)"/g,
    (_, file) => {
      const slug = file.replace(/\.md$/, "");
      return `href="${basePath}/${slug}"`;
    }
  );
  // 给标题加 id 属性，支持目录锚点跳转
  contentHtml = contentHtml.replace(
    /<h([2-6])>(.*?)<\/h\1>/g,
    (_, level, text) => {
      const id = text
        .replace(/<[^>]+>/g, "")
        .replace(/[^\w一-鿿\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      return `<h${level} id="${id}">${text}</h${level}>`;
    }
  );

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <CodeBlock />
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
