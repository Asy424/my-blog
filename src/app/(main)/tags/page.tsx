import { getAllTags, getSortedPostsData } from "@/lib/posts";
import TagBadge from "@/components/TagBadge";

export const metadata = {
  title: "标签",
  description: "所有文章标签",
  alternates: {
    canonical: "/tags",
  },
};

export default function TagsPage() {
  const tags = getAllTags();
  const posts = getSortedPostsData();

  const tagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="animate-fade-in-up">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">标签</h1>
        <p className="mt-2 text-muted">
          共 {tags.length} 个标签
        </p>
      </header>
      {tags.length === 0 ? (
        <div className="text-center py-16 text-muted">
          还没有标签
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up animate-delay-2">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} count={tagCounts[tag]} />
          ))}
        </div>
      )}
    </div>
  );
}
