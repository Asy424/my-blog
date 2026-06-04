import { siteConfig } from "@/site.config";
import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "关于" },
  { href: "/tags", label: "标签" },
  { href: "/rss.xml", label: "RSS" },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200/80 py-10 dark:border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-950 dark:text-gray-50">
              {siteConfig.name}
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              {siteConfig.description}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-blue-600 dark:hover:text-blue-300"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`https://github.com/${siteConfig.github.owner}/${siteConfig.github.repo}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-300"
            >
              GitHub
            </a>
          </nav>
        </div>
        <div className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} {siteConfig.name}. 基于 Next.js 构建，使用 GitHub Pages 部署。
        </div>
      </div>
    </footer>
  );
}
