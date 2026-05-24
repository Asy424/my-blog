"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { GitHubFile } from "@/lib/github-admin";
import {
  listPosts,
  getPostContent,
  savePost,
  verifyToken,
  uploadImage,
  deletePost,
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

    commands.push({
      name: "center",
      keyCommand: "center",
      buttonProps: { "aria-label": "居中文字", title: "居中文字" },
      icon: (() => {
        const React = require("react");
        return React.createElement(
          "svg",
          {
            width: "14",
            height: "14",
            viewBox: "0 0 20 20",
            fill: "currentColor",
          },
          React.createElement("path", {
            d: "M4 3h12v2H4V3zm2 4h8v2H6V7zm-2 4h12v2H4v-2zm2 4h8v2H6v-2z",
          })
        );
      })(),
      execute: (_state: any, api: any) => {
        const selected = _state.selectedText || "";
        if (selected) {
          api.replaceSelection(
            `<center>\n\n${selected}\n\n</center>`
          );
        } else {
          api.replaceSelection(`<center>\n\n\n\n</center>`);
        }
      },
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
    if (sep <= 0) continue;
    const key = line.slice(0, sep).trim();
    let val = line.slice(sep + 2).trim().replace(/^"|"$/g, "");
    // 尝试解析数组格式 tags: ["a", "b"] 或 tags: []
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        const arr = JSON.parse(val);
        if (Array.isArray(arr)) {
          val = arr.filter((v) => typeof v === "string").join(", ");
        }
      } catch {}
    }
    data[key] = val;
  }
  return { data, body: match[2].trimStart() };
}

function buildFrontmatter(title: string, tags: string, description: string) {
  const now = new Date().toISOString().split("T")[0];
  // 清理可能嵌套的括号残余
  const clean = tags.replace(/[\[\]"']+/g, "");
  const tagList = clean.split(/[,\s]+/).filter(Boolean);
  const tagsStr = tagList.map((t) => `"${t}"`).join(", ");
  const lines = [
    "---",
    `title: "${title}"`,
    `date: "${now}"`,
    `tags: [${tagsStr}]`,
    description ? `description: "${description}"` : "",
    "---",
  ].filter(Boolean);
  return lines.join("\n") + "\n\n";
}

function slugify(title: string) {
  // 只保留英文、数字、连字符，中文等非ASCII字符去掉
  const cleaned = title
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  // 如果纯中文标题导致为空，用时间戳
  return cleaned || `post-${Date.now().toString(36)}`;
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
  const [postTitles, setPostTitles] = useState<Record<string, string>>({});

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
    const titles = localStorage.getItem("admin-titles");
    if (titles) {
      try { setPostTitles(JSON.parse(titles)); } catch {}
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
        const textarea = document.querySelector(
          ".w-md-editor-text-input"
        ) as HTMLTextAreaElement;
        const pos = textarea?.selectionStart;
        setContent((prev) => {
          if (pos !== undefined && pos !== null) {
            return prev.slice(0, pos) + detail.text + prev.slice(pos);
          }
          return prev + detail.text;
        });
      } else if (detail.status === "error") {
        setUploading(false);
        setError("图片上传失败: " + detail.message);
      }
    }
    window.addEventListener("admin-image-upload", handler);
    return () => window.removeEventListener("admin-image-upload", handler);
  }, []);

  const editorRef = useRef({ title: "", tags: "", description: "", content: "" });
  editorRef.current = { title, tags, description, content };

  // 自动保存草稿 + 恢复
  useEffect(() => {
    const DRAFT_KEY = "admin-draft";
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && !title && !content) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          if (confirm("检测到未保存的草稿，是否恢复？")) {
            setTitle(draft.title || "");
            setTags(draft.tags || "");
            setDescription(draft.description || "");
            setContent(draft.content || "");
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      } catch {}
    }
    const timer = setInterval(() => {
      const d = editorRef.current;
      if (d.title || d.content) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      // 记住标题
      const t = data.title || file.name.replace(".md", "");
      setPostTitles((prev) => {
        const next = { ...prev, [file.path]: t };
        localStorage.setItem("admin-titles", JSON.stringify(next));
        return next;
      });
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
      localStorage.removeItem("admin-draft");
      // 更新标题映射
      setPostTitles((prev) => {
        const next = { ...prev, [path]: title.trim() };
        localStorage.setItem("admin-titles", JSON.stringify(next));
        return next;
      });
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
      const md = `\n![${file.name}](${url})\n`;
      const textarea = document.querySelector(
        ".w-md-editor-text-input"
      ) as HTMLTextAreaElement;
      const pos = textarea?.selectionStart;
      setContent((prev) => {
        if (pos !== undefined && pos !== null) {
          return prev.slice(0, pos) + md + prev.slice(pos);
        }
        return prev + md;
      });
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
    if (!editingFile) return;
    if (!confirm(`确认删除文章「${title || editingFile.name}」？\n此操作不可撤销。`)) return;

    setLoading(true);
    setError("");
    try {
      await deletePost(token, editingFile.path, editingFile.sha);
      setSuccess("文章已删除");
      resetEditor();
      await loadPosts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
          {editingFile && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm rounded-md border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              删除
            </button>
          )}
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
                  {postTitles[post.path] || post.name.replace(".md", "")}
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
