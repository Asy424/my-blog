"use client";

import { useEffect } from "react";

export default function MouseTrail() {
  useEffect(() => {
    // 禁用：减少动效偏好 或 触摸设备
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let mouseX = -100;
    let mouseY = -100;
    const dots: { x: number; y: number; alpha: number }[] = [];
    let frameId = 0;
    let idleTimer = 0;
    let running = false;

    // 从主题读取 accent 色，粒子用 accent 暖色调（而非彩虹色）
    function getAccentColor(): string {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--accent").trim() || "#2d5a27";
    }
    const accentColor = getAccentColor();

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!running) {
        running = true;
        idleTimer = 0;
        frameId = requestAnimationFrame(animate);
      }
    }

    function animate() {
      dots.push({ x: mouseX, y: mouseY, alpha: 0.55 });
      if (dots.length > 15) dots.shift();

      ctx.clearRect(0, 0, w, h);
      let hasVisible = false;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.alpha -= 0.04;
        if (d.alpha <= 0) continue;
        hasVisible = true;
        const size = (i / dots.length) * 6 + 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = d.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      idleTimer++;
      // 鼠标静止约 500ms 后停止动画
      if (idleTimer > 30 && !hasVisible) {
        running = false;
        dots.length = 0;
        ctx.clearRect(0, 0, w, h);
        return;
      }
      frameId = requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(frameId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}
