"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/**
 * 后台预览：与线上渲染共用 remark → GFM 管线（react-markdown 内部即 remark 生态），
 * 消除此前手写正则渲染器与发布效果不一致的问题。
 * react-markdown 默认对 URL 做协议白名单消毒（阻止 javascript: 等），原始 HTML 默认不渲染，与线上行为一致。
 */
const components: Components = {
  a({ href, children, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
};

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="admin-markdown-preview prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content || "预览会显示在这里。"}
      </ReactMarkdown>
    </div>
  );
}
