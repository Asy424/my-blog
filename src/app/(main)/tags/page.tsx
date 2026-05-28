import { getAllTags, getSortedPostsData } from "@/lib/posts";
import TagBadge from "@/components/TagBadge";

export const metadata = {
  title: "标签",
  description: "所有文章标签",
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
      <h1 className="text-3xl font-bold tracking-tight">标签</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        共 {tags.length} 个标签
      </p>
      {tags.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          还没有标签
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} count={tagCounts[tag]} />
          ))}
        </div>
      )}
    </div>
  );
}
