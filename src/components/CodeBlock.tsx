"use client";

import { useEffect } from "react";

export default function CodeBlock() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const codeBlocks = document.querySelectorAll("pre code");

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement;
      if (!pre || pre.querySelector(".copy-button")) return;

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

      const showButton = () => {
        button.style.opacity = "1";
      };
      const hideButton = () => {
        button.style.opacity = "0";
      };
      const copyCode = async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent || "");
          button.textContent = "已复制";
          button.style.background = "rgba(34, 197, 94, 0.3)";
          window.setTimeout(() => {
            button.textContent = "复制";
            button.style.background = "rgba(255, 255, 255, 0.1)";
          }, 2000);
        } catch {
          button.textContent = "复制失败";
          window.setTimeout(() => {
            button.textContent = "复制";
          }, 2000);
        }
      };

      pre.style.position = "relative";
      pre.addEventListener("mouseenter", showButton);
      pre.addEventListener("mouseleave", hideButton);
      button.addEventListener("click", copyCode);
      pre.appendChild(button);

      cleanups.push(() => {
        pre.removeEventListener("mouseenter", showButton);
        pre.removeEventListener("mouseleave", hideButton);
        button.removeEventListener("click", copyCode);
        button.remove();
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
