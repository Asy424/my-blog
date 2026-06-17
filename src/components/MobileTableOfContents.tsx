interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface MobileTableOfContentsProps {
  headings: TocHeading[];
}

export default function MobileTableOfContents({
  headings,
}: MobileTableOfContentsProps) {
  if (headings.length === 0) return null;

  return (
    <details className="mb-8 rounded-lg border border-border bg-card p-4 lg:hidden">
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        目录
      </summary>
      <ol className="mt-3 space-y-2 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${heading.id}`}
              className="block text-muted transition-colors hover:text-accent"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
