"use client";

import { useEffect } from "react";

export default function CodeBlock() {
  useEffect(() => {
    // 给所有代码块添加复制按钮
    const codeBlocks = document.querySelectorAll("pre code");

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement;
      if (!pre || pre.querySelector(".copy-button")) return;

      // 创建复制按钮
      const button = document.createElement("button");
      button.className = "copy-button";
      button.textContent = "复制";
      button.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #e5e7eb;
        font-size: 12px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
      `;

      // 鼠标悬停显示按钮
      pre.style.position = "relative";
      pre.addEventListener("mouseenter", () => {
        button.style.opacity = "1";
      });
      pre.addEventListener("mouseleave", () => {
        button.style.opacity = "0";
      });

      // 复制功能
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent || "");
          button.textContent = "已复制!";
          button.style.background = "rgba(34, 197, 94, 0.3)";
          setTimeout(() => {
            button.textContent = "复制";
            button.style.background = "rgba(255, 255, 255, 0.1)";
          }, 2000);
        } catch (err) {
          button.textContent = "复制失败";
          setTimeout(() => {
            button.textContent = "复制";
          }, 2000);
        }
      });

      pre.appendChild(button);
    });
  }, []);

  return null;
}
