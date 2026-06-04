import { notFound } from "next/navigation";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getSortedPostsData, getPostNeighbors } from "@/lib/posts";
import TagBadge from "@/components/TagBadge";
import CodeBlock from "@/components/CodeBlock";
import ImageLightbox from "@/components/ImageLightbox";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import PostNav from "@/components/PostNav";
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
    <article className="max-w-6xl mx-auto px-4 py-12">
      <ReadingProgress />
      <CodeBlock />
      <ImageLightbox />
      <header className="mb-10 animate-fade-in-up">
        <h1 className="font-display text-3xl font-normal tracking-tight leading-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted">
          <time dateTime={post.date}>{post.date}</time>
          {post.readingTime && (
            <>
              <span className="text-border">·</span>
              <span>约 {post.readingTime} 分钟阅读</span>
            </>
          )}
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
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>
      <PostNav prev={neighbors.prev} next={neighbors.next} />
    </article>
  );
}
