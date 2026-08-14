"use client";

import { useEffect } from "react";

export default function CodeBlock() {
  useEffect(() => {
    // 触屏设备（pointer: coarse）没有 hover，复制按钮需要常显
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const cleanups: Array<() => void> = [];
    const codeBlocks = document.querySelectorAll("pre code");

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement;
      if (!pre || pre.querySelector(".copy-button")) return;

      const button = document.createElement("button");
      button.className = "copy-button";
      button.type = "button";
      button.textContent = "复制";
      button.setAttribute("aria-label", "复制代码块内容");

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
          button.setAttribute("aria-label", "代码已复制");
          button.style.background = "rgba(34, 197, 94, 0.3)";
          window.setTimeout(() => {
            button.textContent = "复制";
            button.setAttribute("aria-label", "复制代码块内容");
            button.style.background = "rgba(255, 255, 255, 0.1)";
          }, 2000);
        } catch {
          button.textContent = "复制失败";
          button.setAttribute("aria-label", "复制代码失败");
          window.setTimeout(() => {
            button.textContent = "复制";
            button.setAttribute("aria-label", "复制代码块内容");
          }, 2000);
        }
      };

      pre.style.position = "relative";
      if (isTouch) {
        button.style.opacity = "1";
      } else {
        pre.addEventListener("mouseenter", showButton);
        pre.addEventListener("mouseleave", hideButton);
      }
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
