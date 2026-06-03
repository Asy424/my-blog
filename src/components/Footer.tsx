import { siteConfig } from "@/site.config";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-16">
      <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <p className="mt-1">
          基于 Next.js 构建 · 使用 GitHub Pages 部署
        </p>
      </div>
    </footer>
  );
}
