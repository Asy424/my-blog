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

export interface GitHubImageFile extends GitHubFile {
  url: string;
}

interface GitHubContentFile extends GitHubFile {
  content?: string;
}

interface GitHubContentItem extends GitHubFile {
  type: "file" | "dir" | string;
  download_url?: string | null;
}

interface GitHubWriteBody {
  message: string;
  content: string;
  sha?: string;
}

interface GitHubError {
  message?: string;
}

async function githubErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const err = (await res.json()) as GitHubError;
    return err.message ? `${fallback}: ${err.message}` : `${fallback}: ${res.status}`;
  } catch {
    return `${fallback}: ${res.status}`;
  }
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

function isGitHubContentItem(file: unknown): file is GitHubContentItem {
  return isGitHubFile(file) && "type" in file && typeof (file as GitHubContentItem).type === "string";
}

function isImagePath(path: string): boolean {
  // 不含 svg：SVG 可内嵌脚本，存在同源 XSS 风险，上传和媒体库一律不支持
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(path);
}

export async function listPosts(token: string): Promise<GitHubFile[]> {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/posts`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error(await githubErrorMessage(res, "获取文章列表失败"));
  const data = (await res.json()) as unknown;
  return Array.isArray(data)
    ? data.filter((file): file is GitHubFile => isGitHubFile(file) && file.name.endsWith(".md"))
    : [];
}

export async function listImages(token: string): Promise<GitHubImageFile[]> {
  async function walk(dir: string): Promise<GitHubImageFile[]> {
    const res = await fetch(
      `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${dir}`,
      { headers: headers(token) }
    );
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(await githubErrorMessage(res, "获取媒体库失败"));

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];

    const entries = data.filter(isGitHubContentItem);
    const nested = await Promise.all(
      entries.map(async (item) => {
        if (item.type === "dir") return walk(item.path);
        if (item.type === "file" && isImagePath(item.path)) {
          const publicPath = item.path.replace(/^public\//, "");
          return [
            {
              name: item.name,
              path: item.path,
              sha: item.sha,
              size: item.size,
              url: withBasePath(`/${publicPath}`),
            },
          ];
        }
        return [];
      })
    );

    return nested.flat();
  }

  const images = await walk("public/images");
  return images.sort((a, b) => b.path.localeCompare(a.path));
}

export async function getPostContent(
  token: string,
  path: string
): Promise<{ content: string; sha: string }> {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error(await githubErrorMessage(res, "获取文章失败"));
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
    throw new Error(await githubErrorMessage(res, "保存失败"));
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
    throw new Error(await githubErrorMessage(res, "删除失败"));
  }
}

/**
 * 压缩图片：PNG 保持 PNG（保留透明通道），其他格式转 WebP（质量 0.82）。
 * 返回压缩后的 Blob 及其 MIME 类型，供上传时确定文件扩展名。
 */
async function compressImage(file: File, maxWidth = 1200): Promise<{ blob: Blob; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const releaseObjectUrl = () => URL.revokeObjectURL(objectUrl);
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
          releaseObjectUrl();
          if (blob) resolve({ blob, mime: outputType });
          else reject(new Error("图片压缩失败"));
        },
        outputType,
        quality
      );
    };
    img.onerror = () => {
      releaseObjectUrl();
      reject(new Error("图片加载失败"));
    };
    img.src = objectUrl;
  });
}

export async function uploadImage(
  token: string,
  file: File
): Promise<{ url: string; path: string }> {
  // 拒绝 SVG：可内嵌脚本，即使压缩也会先被浏览器解析，存在同源 XSS 风险
  if (
    file.type === "image/svg+xml" ||
    /\.svg$/i.test(file.name)
  ) {
    throw new Error("不支持上传 SVG 图片，请使用 PNG / JPEG / WebP / GIF / AVIF");
  }
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
    throw new Error(await githubErrorMessage(res, "图片上传失败"));
  }

  return {
    url: withBasePath(`/images/${dir}/${name}`),
    path: `images/${dir}/${name}`,
  };
}

export interface TokenVerification {
  valid: boolean;
  /** 权限范围过宽的提示文案；无风险时为空字符串 */
  warning: string;
}

// classic PAT 中超出「单仓库 contents 最小权限」的典型 scope
const WIDE_SCOPE_PATTERNS: RegExp[] = [
  /(^|,)\s*repo\s*(,|$)/i, // 全部仓库读写
  /(^|,)\s*delete_repo\s*(,|$)/i,
  /(^|,)\s*workflow\s*(,|$)/i,
  /(^|,)\s*admin:/i,
  /(^|,)\s*write:/i,
  /(^|,)\s*gist\s*(,|$)/i,
];

export async function verifyToken(token: string): Promise<TokenVerification> {
  try {
    const userRes = await fetch(`${API_BASE}/user`, { headers: headers(token) });
    if (!userRes.ok) return { valid: false, warning: "" };

    // classic PAT 会返回 X-OAuth-Scopes 头；fine-grained token 不返回该头，跳过判断避免误报
    const scopesHeader = userRes.headers.get("X-OAuth-Scopes") || "";
    const scopeWide = scopesHeader
      ? WIDE_SCOPE_PATTERNS.some((pattern) => pattern.test(scopesHeader))
      : false;

    const repoRes = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}`, {
      headers: headers(token),
    });
    if (!repoRes.ok) return { valid: false, warning: "" };
    const repo = (await repoRes.json()) as { permissions?: { push?: boolean } };
    if (repo.permissions?.push !== true) return { valid: false, warning: "" };

    return {
      valid: true,
      warning: scopeWide
        ? "当前 Token 权限范围较宽（包含仓库级或全局权限）。建议改用只授予当前仓库 contents 权限的最小 Token，以降低泄露影响。"
        : "",
    };
  } catch {
    return { valid: false, warning: "" };
  }
}
