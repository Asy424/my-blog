"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { GitHubFile } from "@/lib/github-admin";
import {
  listPosts,
  getPostContent,
  savePost,
  verifyToken,
  uploadImage,
} from "@/lib/github-admin";

let currentToken = "";

const MDEditor = dynamic(
  async () => {
    const [mod, cn] = await Promise.all([
      import("@uiw/react-md-editor"),
      import("@uiw/react-md-editor/commands-cn"),
    ]);
    const Editor = mod.default;
    const { getCommands, getExtraCommands } = cn;
    const commands = getCommands();
    const extraCommands = getExtraCommands();

    commands.forEach((cmd: any) => {
      if (cmd.name === "image") {
        cmd.execute = (_state: any, api: any) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.style.display = "none";
          document.body.appendChild(input);
          input.onchange = async () => {
            const file = input.files?.[0];
            document.body.removeChild(input);
            if (!file) return;
            if (!currentToken) {
              alert("Token 未设置，请重新登录");
              return;
            }
            window.dispatchEvent(
              new CustomEvent("admin-image-upload", {
                detail: { status: "start" },
              })
            );
            try {
              const { url } = await uploadImage(currentToken, file);
              window.dispatchEvent(
                new CustomEvent("admin-image-upload", {
                  detail: { status: "done", text: `\n![${file.name}](${url})\n` },
                })
              );
            } catch (e: any) {
              window.dispatchEvent(
                new CustomEvent("admin-image-upload", {
                  detail: { status: "error", message: e.message || "未知错误" },
                })
              );
            }
          };
          input.click();
        };
      }
      if (cmd.name === "link") {
        cmd.execute = (state: any, api: any) => {
          const title = window.prompt(
            "请输入链接标题：",
            state.selectedText || ""
          );
          if (title === null) return;
          const url = window.prompt("请输入链接地址：", "https://");
          if (url) {
            api.replaceSelection(`[${title}](${url})`);
          }
        };
      }
    });

    return {
      default: (props: any) => (
        <Editor
          {...props}
          commands={commands}
          extraCommands={extraCommands}
        />
      ),
    };
  },
  { ssr: false }
);

const STORAGE_KEY = "gh_token";

function parseFrontmatter(
  content: string
): { data: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const sep = line.indexOf(": ");
    if (sep > 0) {
      const key = line.slice(0, sep).trim();
      const val = line.slice(sep + 2).trim().replace(/^"|"$/g, "");
      data[key] = val;
    }
  }
  return { data, body: match[2].trimStart() };
}

function buildFrontmatter(title: string, tags: string, description: string) {
  const now = new Date().toISOString().split("T")[0];
  const lines = [
    "---",
    `title: "${title}"`,
    `date: "${now}"`,
    `tags: [${tags.split(/[,\s]+/).filter(Boolean).join(", ")}]`,
    description ? `description: "${description}"` : "",
    "---",
  ].filter(Boolean);
  return lines.join("\n") + "\n\n";
}

function slugify(title: string) {
  return title
    .replace(/[^\w一-鿿\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [stored, setStored] = useState(false);
  const [posts, setPosts] = useState<GitHubFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // editor state
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [editingFile, setEditingFile] = useState<GitHubFile | null>(null);

  const [uploading, setUploading] = useState(false);

  // token input
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setToken(saved);
      setStored(true);
      currentToken = saved;
    }
  }, []);

  useEffect(() => {
    currentToken = token;
  }, [token]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const ok = await verifyToken(token);
      if (!ok) {
        setError("Token 无效，请重新设置");
        localStorage.removeItem(STORAGE_KEY);
        setStored(false);
        return;
      }
      const data = await listPosts(token);
      setPosts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (stored && token) loadPosts();
  }, [stored, token, loadPosts]);

  useEffect(() => {
    function handler(e: Event) {
      const { detail } = e as CustomEvent;
      if (detail.status === "start") {
        setUploading(true);
      } else if (detail.status === "done") {
        setUploading(false);
        setContent((prev) => prev + detail.text);
      } else if (detail.status === "error") {
        setUploading(false);
        setError("图片上传失败: " + detail.message);
      }
    }
    window.addEventListener("admin-image-upload", handler);
    return () => window.removeEventListener("admin-image-upload", handler);
  }, []);

  function handleTokenSubmit() {
    const t = tokenInput.trim();
    if (!t) return;
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
    setTokenInput("");
    setStored(true);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setStored(false);
    setPosts([]);
    resetEditor();
  }

  function resetEditor() {
    setTitle("");
    setTags("");
    setDescription("");
    setContent("");
    setEditingFile(null);
    setError("");
    setSuccess("");
  }

  async function handleSelectPost(file: GitHubFile) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { content: raw, sha } = await getPostContent(token, file.path);
      const { data, body } = parseFrontmatter(raw);
      setTitle(data.title || file.name.replace(".md", ""));
      setTags(Array.isArray(data.tags) ? data.tags.join(", ") : data.tags || "");
      setDescription(data.description || "");
      setContent(body.trimStart());
      setEditingFile({ ...file, sha });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!title.trim()) {
      setError("请输入文章标题");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const slug = slugify(title);
    const frontmatter = buildFrontmatter(title.trim(), tags.trim(), description.trim());
    const fullContent = frontmatter + content.trimStart();

    try {
      const path = editingFile
        ? editingFile.path
        : `posts/${slug}.md`;

      await savePost(
        token,
        path,
        fullContent,
        editingFile?.sha
      );
      setSuccess("发布成功！文章已提交到 GitHub，Actions 正在自动部署...");
      await loadPosts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadAndInsert(file: File) {
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadImage(token, file);
      setContent((prev) => prev + `\n![${file.name}](${url})\n`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.files || []);
    const image = items.find((f) => f.type.startsWith("image/"));
    if (image) {
      e.preventDefault();
      uploadAndInsert(image);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.files || []);
    const image = items.find((f) => f.type.startsWith("image/"));
    if (image) {
      uploadAndInsert(image);
    }
  }

  async function handleDelete() {
    // delete is not implemented via API for safety
  }

  if (!stored) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2">管理员登录</h1>
          <p className="text-sm text-gray-500 mb-6">
            输入 GitHub Personal Access Token 以访问编辑器
          </p>
          <input
            type="password"
            placeholder="粘贴你的 GitHub Token..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTokenSubmit()}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent outline-none focus:border-blue-500 mb-4"
          />
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <button
            onClick={handleTokenSubmit}
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            进入管理后台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">写文章</h1>
          {editingFile && (
            <span className="text-sm text-gray-400">
              编辑: {editingFile.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {uploading && (
            <span className="text-sm text-blue-500">图片上传中...</span>
          )}
          {success && (
            <span className="text-sm text-green-600">{success}</span>
          )}
          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
          <button
            onClick={resetEditor}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            新建
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "处理中..." : editingFile ? "更新" : "发布"}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              文章列表 ({posts.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {posts.map((post) => (
              <button
                key={post.sha}
                onClick={() => handleSelectPost(post)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  editingFile?.path === post.path
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="truncate block">
                  {post.name.replace(".md", "")}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* 编辑器区域 */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* 标题 */}
          <input
            type="text"
            placeholder="输入文章标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-6 py-4 text-2xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 outline-none placeholder-gray-300 dark:placeholder-gray-600"
          />

          {/* 标签和描述 */}
          <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-200 dark:border-gray-700 text-sm">
            <input
              type="text"
              placeholder="标签（逗号分隔）"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-600 flex-1"
            />
            <input
              type="text"
              placeholder="文章简介（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-600 flex-1"
            />
          </div>

          {/* Markdown 编辑器 */}
          <div className="flex-1 overflow-hidden" data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val: string) => setContent(val || "")}
              height="100%"
              preview="live"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
