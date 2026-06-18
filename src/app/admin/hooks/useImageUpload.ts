"use client";

import { useState, useCallback } from "react";
import { uploadImage } from "@/lib/github-admin";

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
        const alt = file.name.replace(/\.[^.]+$/, "");
        return `\n![${alt}](${url})\n`;
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

  return { uploading, uploadError, upload, clearUploadError };
}
