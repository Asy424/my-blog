import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import {
  getPostsBySeries,
  getSeriesBySlug,
  seriesList,
} from "@/lib/series";
import { siteConfig } from "@/site.config";

interface SeriesDetailPageProps {
  params: Promise<{ series: string }>;
}

export async function generateMetadata({ params }: SeriesDetailPageProps) {
  const { series: slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) return { title: "系列未找到" };
  const path = `/series/${series.slug}`;

  return {
    title: series.title,
    description: series.description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: series.title,
      description: series.description || siteConfig.description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name,
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return seriesList.map((series) => ({
    series: series.slug,
  }));
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { series: slug } = await params;
  const series = getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const posts = getPostsBySeries(series);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="border-b border-border pb-8 animate-fade-in-up">
        <p className="text-sm font-medium text-accent tracking-wide">
          系列
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tight text-foreground">
          {series.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
          {series.description}
        </p>
        <div className="mt-5 text-sm text-muted">
          共 {posts.length} 篇公开文章
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center text-muted">
          这个系列暂时没有公开文章。
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {posts.map((post, i) => (
            <div key={post.slug} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
