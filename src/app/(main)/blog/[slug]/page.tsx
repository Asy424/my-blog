import { notFound } from "next/navigation";
import Link from "next/link";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getSortedPostsData, getPostNeighbors } from "@/lib/posts";
import { getPostSeriesPosition } from "@/lib/series";
import TagBadge from "@/components/TagBadge";
import CodeBlock from "@/components/CodeBlock";
import ImageLightbox from "@/components/ImageLightbox";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import PostNav from "@/components/PostNav";
import { siteConfig, withBasePath } from "@/site.config";

/** 系列色辅助类映射（静态字符串，避免 Tailwind purge） */
const seriesClass: Record<string, string> = {
  codex: "s-codex",
  "windows-setup": "s-windows",
  "java-functional": "s-java",
  "blog-building": "s-blog",
};

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

/** 给代码块添加语言标签 */
function rehypeCodeLanguage() {
  return (tree: RehypeNode) => {
    function visit(node: RehypeNode) {
      if (
        node.type === "element" &&
        node.tagName === "pre" &&
        node.children?.[0]?.tagName === "code"
      ) {
        const codeNode = node.children[0];
        const classes = (codeNode.properties?.className as string[]) || [];
        const langClass = classes.find((c: string) => c.startsWith("language-"));
        if (langClass) {
          const lang = langClass.replace("language-", "");
          node.properties = { ...node.properties, "data-language": lang };
        }
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}

/** 图片懒加载 */
function rehypeLazyImages() {
  return (tree: RehypeNode) => {
    function visit(node: RehypeNode) {
      if (node.type === "element" && node.tagName === "img") {
        node.properties = { ...node.properties, loading: "lazy", decoding: "async" };
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
  const neighbors = getPostNeighbors(slug);
  const seriesPosition = getPostSeriesPosition(post);
  const seriesCls = seriesPosition ? seriesClass[seriesPosition.series.slug] ?? "" : "";
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rewriteMarkdownLinks, blogBasePath)
    .use(rehypeSlug)
    .use(collectTocHeadings, headings)
    .use(rehypeShiki, {
      theme: "one-dark-pro",
    })
    .use(rehypeCodeLanguage)
    .use(rehypeLazyImages)
    .use(rehypeStringify)
    .process(post.content || "");
  const contentHtml = processedContent.toString();

  return (
    <article className={["max-w-6xl mx-auto px-4 py-12", seriesCls].filter(Boolean).join(" ")}>
      <ReadingProgress />
      <CodeBlock />
      <ImageLightbox />
      <header className="mb-10 animate-fade-in-up">
        <h1 className="font-display text-3xl font-normal tracking-tight leading-tight sm:text-4xl sm:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={post.date}>{post.date}</time>
          </span>
          {post.readingTime && (
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>约 {post.readingTime} 分钟阅读</span>
            </span>
          )}
        </div>

        {/* 所属系列 + 阅读进度 */}
        {seriesPosition && (
          <div
            className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-border p-4"
            style={{ background: "var(--series-soft)", boxShadow: "var(--shadow-soft)" }}
          >
            <Link
              href={`/series/${seriesPosition.series.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--series)" }}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: "var(--series)" }}
              />
              {seriesPosition.series.title}
            </Link>
            <span className="text-sm text-muted">
              第 {seriesPosition.index} / {seriesPosition.total} 篇
            </span>
            {/* 进度条 */}
            <div className="min-w-[6rem] flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--series) 18%, transparent)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(seriesPosition.index / seriesPosition.total) * 100}%`,
                    background: "var(--series)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

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
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>
      <PostNav prev={neighbors.prev} next={neighbors.next} />
    </article>
  );
}
