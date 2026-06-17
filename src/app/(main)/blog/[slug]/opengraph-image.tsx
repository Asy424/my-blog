import { ImageResponse } from "next/og";
import { getPostBySlug, getSortedPostsData } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export const alt = siteConfig.name;
export const dynamic = "force-static";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export function generateStaticParams() {
  return getSortedPostsData().map((post) => ({
    slug: post.slug,
  }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title || siteConfig.name;
  const description = post?.description || siteConfig.description;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f5ef",
          color: "#1f2933",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
          <span style={{ color: "#9f3a38" }}>{siteConfig.name}</span>
          {post?.date && <span style={{ color: "#66727f" }}>{post.date}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ fontSize: 72, lineHeight: 1.1, letterSpacing: 0 }}>
            {title}
          </div>
          <div style={{ width: "78%", fontSize: 30, lineHeight: 1.38, color: "#4f5b66" }}>
            {description}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {(post?.tags || []).slice(0, 4).map((tag) => (
            <span
              key={tag}
              style={{
                border: "1px solid #d6c9bb",
                color: "#5d6670",
                padding: "8px 14px",
                fontSize: 22,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    ),
    size
  );
}
