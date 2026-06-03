import { notFound } from "next/navigation";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getSortedPostsData } from "@/lib/posts";
import TagBadge from "@/components/TagBadge";
import CodeBlock from "@/components/CodeBlock";
import ImageLightbox from "@/components/ImageLightbox";
import { siteConfig, withBasePath } from "@/site.config";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

interface RehypeNode {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: RehypeNode[];
}

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function getNodeText(node: RehypeNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }
  return node.children?.map(getNodeText).join("") ?? "";
}

function rewriteMarkdownLinks(blogBasePath: string) {
  return (tree: RehypeNode) => {
    function visit(node: RehypeNode) {
      if (node.type === "element" && node.tagName === "a") {
        const href = node.properties?.href;
        if (
          typeof href === "string" &&
          href.startsWith("./") &&
          href.endsWith(".md")
        ) {
          const slug = href.slice(2, -3);
          node.properties = {
            ...node.properties,
            href: `${blogBasePath}/${slug}`,
          };
        }
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}

function collectTocHeadings(headings: TocHeading[]) {
  return (tree: RehypeNode) => {
    function visit(node: RehypeNode) {
      if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
        const id = node.properties?.id;
        const text = getNodeText(node).trim();
        if (typeof id === "string" && text) {
          headings.push({
            id,
            text,
            level: node.tagName === "h2" ? 2 : 3,
          });
        }
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.public) return { title: "文章未找到" };
  const path = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: post.title,
      description: post.description || siteConfig.description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      tags: post.tags,
    },
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

  if (!post || !post.public) {
    notFound();
  }

  const headings: TocHeading[] = [];
  const blogBasePath = withBasePath("/blog");
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rewriteMarkdownLinks, blogBasePath)
    .use(rehypeSlug)
    .use(collectTocHeadings, headings)
    .use(rehypeShiki, {
      theme: "one-dark-pro",
    })
    .use(rehypeStringify)
    .process(post.content || "");
  const contentHtml = processedContent.toString();

  return (
    <article className="max-w-6xl mx-auto px-4 py-12">
      <CodeBlock />
      <ImageLightbox />
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
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
        {headings.length > 0 && (
          <aside className="hidden lg:block">
            <nav className="sticky top-24 border-l border-gray-200 dark:border-gray-800 pl-5 text-sm">
              <div className="mb-3 font-medium text-gray-900 dark:text-gray-100">
                目录
              </div>
              <ol className="space-y-2">
                {headings.map((heading) => (
                  <li
                    key={heading.id}
                    className={heading.level === 3 ? "pl-4" : undefined}
                  >
                    <a
                      href={`#${heading.id}`}
                      className="block text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
      </div>
    </article>
  );
}
