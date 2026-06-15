import { siteConfig, withBasePath } from "@/site.config";

const API_BASE = "https://api.github.com";
const { owner: REPO_OWNER, repo: REPO_NAME } = siteConfig.github;

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function headers(token: string) {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
  };
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
}

interface GitHubContentFile extends GitHubFile {
  content?: string;
}

interface GitHubWriteBody {
  message: string;
  content: string;
  sha?: string;
}

interface GitHubError {
  message?: string;
}

function isGitHubFile(file: unknown): file is GitHubFile {
  return (
    typeof file === "object" &&
    file !== null &&
    "name" in file &&
    "path" in file &&
    "sha" in file &&
    typeof (file as GitHubFile).name === "string" &&
    typeof (file as GitHubFile).path === "string" &&
    typeof (file as GitHubFile).sha === "string"
  );
}

export async function listPosts(token: string): Promise<GitHubFile[]> {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/posts`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error("获取文章列表失败: " + res.status);
  const data = (await res.json()) as unknown;
  return Array.isArray(data)
    ? data.filter((file): file is GitHubFile => isGitHubFile(file) && file.name.endsWith(".md"))
    : [];
}

export async function getPostContent(
  token: string,
  path: string
): Promise<{ content: string; sha: string }> {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error("获取文章失败: " + res.status);
  const data = (await res.json()) as GitHubContentFile;
  const bytes = Uint8Array.from(atob(data.content || ""), (c) => c.charCodeAt(0));
  const content = new TextDecoder("utf-8").decode(bytes);
  return { content, sha: data.sha };
}

export async function savePost(
  token: string,
  path: string,
  content: string,
  sha?: string
): Promise<void> {
  // 如果没有传 sha，尝试获取现有文件的 sha
  if (!sha) {
    try {
      const res = await fetch(
        `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
        { headers: headers(token) }
      );
      if (res.ok) {
        const data = (await res.json()) as GitHubContentFile;
        sha = data.sha;
      }
    } catch {}
  }
  const body: GitHubWriteBody = {
    message: sha ? `更新文章: ${path}` : `新文章: ${path}`,
    content: toBase64(content),
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    // SHA 冲突：该文件在编辑期间被改动过，提示用户而非静默覆盖
    if (res.status === 409) {
      throw new Error("文件已被其他方式修改，请刷新文章列表后重新编辑，避免覆盖他人改动");
    }
    const err = (await res.json()) as GitHubError;
    throw new Error(err.message || "保存失败: " + res.status);
  }
}

export async function deletePost(
  token: string,
  path: string,
  sha: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: "DELETE",
      headers: headers(token),
      body: JSON.stringify({ message: `删除文章: ${path}`, sha }),
    }
  );
  if (!res.ok) {
    const err = (await res.json()) as GitHubError;
    throw new Error(err.message || "删除失败: " + res.status);
  }
}

/**
 * 压缩图片：PNG 保持 PNG（保留透明通道），其他格式转 WebP（质量 0.82）。
 * 返回压缩后的 Blob 及其 MIME 类型，供上传时确定文件扩展名。
 */
async function compressImage(file: File, maxWidth = 1200): Promise<{ blob: Blob; mime: string }> {
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

      const isPNG = file.type === "image/png";
      const outputType = isPNG ? "image/png" : "image/webp";
      const quality = isPNG ? undefined : 0.82;

      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, mime: outputType });
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

export async function uploadImage(
  token: string,
  file: File
): Promise<{ url: string; path: string }> {
  const { blob: compressed, mime } = await compressImage(file);
  const buffer = await compressed.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  const ext = mime === "image/png" ? "png" : "webp";
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  const name = `${Date.now()}-${baseName}.${ext}`;
  const path = `public/images/${dir}/${name}`;

  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: `上传图片: ${name}`,
        content: btoa(binary),
      }),
    }
  );

  if (!res.ok) {
    const err = (await res.json()) as GitHubError;
    throw new Error(err.message || "图片上传失败: " + res.status);
  }

  return {
    url: withBasePath(`/images/${dir}/${name}`),
    path: `images/${dir}/${name}`,
  };
}

export function verifyToken(token: string): Promise<boolean> {
  return fetch(`${API_BASE}/user`, { headers: headers(token) })
    .then((res) => res.ok)
    .catch(() => false);
}
