"use client";

import { useEffect } from "react";

export default function MouseTrail() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let mouseX = -100;
    let mouseY = -100;
    const dots: { x: number; y: number; alpha: number }[] = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animate() {
      dots.push({ x: mouseX, y: mouseY, alpha: 0.6 });
      if (dots.length > 15) dots.shift();

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.alpha -= 0.04;
        if (d.alpha <= 0) continue;
        const size = (i / dots.length) * 6 + 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${d.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    animate();

    return () => {
      document.body.removeChild(canvas);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return null;
}
