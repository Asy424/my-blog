"use client";

import { useState, useCallback } from "react";
import { uploadImage } from "@/lib/github-admin";

async function compressImage(file: File, maxWidth = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(img.width, maxWidth);
      const h = Math.round((img.height * w) / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      // PNG 保持 PNG 以保留透明通道，其他格式转 WebP
      const isPNG = file.type === "image/png";
      const outputType = isPNG ? "image/png" : "image/webp";
      const quality = isPNG ? undefined : 0.82;

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("图片压缩失败"));
        },
        outputType,
        quality
      );
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = URL.createObjectURL(file);
  });
}

export function useImageUpload(token: string) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      if (!token) {
        setUploadError("请先登录");
        return null;
      }
      setUploading(true);
      setUploadError("");
      try {
        const { url } = await uploadImage(token, file);
        return `\n![${file.name}](${url})\n`;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "上传失败";
        setUploadError(msg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [token]
  );

  const clearUploadError = useCallback(() => setUploadError(""), []);

  return { uploading, uploadError, upload, clearUploadError, compressImage };
}
