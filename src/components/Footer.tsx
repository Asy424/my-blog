import { siteConfig } from "@/site.config";
import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "关于" },
  { href: "/tags", label: "标签" },
  { href: "/rss.xml", label: "RSS" },
  { href: `https://github.com/${siteConfig.github.owner}/${siteConfig.github.repo}`, label: "GitHub", external: true },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-display text-base text-foreground">
              {siteConfig.name}
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              {siteConfig.description}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
        <div className="mt-8 text-xs text-muted/60">
          &copy; {new Date().getFullYear()} {siteConfig.name}. 基于 Next.js 构建，使用 GitHub Pages 部署。
        </div>
      </div>
    </footer>
  );
}
