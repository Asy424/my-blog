"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ClipboardEvent, DragEvent } from "react";
import type { GitHubFile } from "@/lib/github-admin";
import {
  listPosts,
  getPostContent,
  savePost,
  deletePost,
} from "@/lib/github-admin";
import { createSeriesSlug, seriesDefinitions } from "@/lib/series-config";
import {
  normalizeSlug,
  parseTagList,
  todayString,
  validatePostDraft,
} from "@/lib/post-schema";
import {
  parseFrontmatter,
  buildFrontmatter,
  slugify,
  fallbackSlug,
  draftSignature,
  dateField,
  stringField,
  tagListField,
  booleanField,
} from "../lib/frontmatter";
import { useImageUpload } from "./useImageUpload";
import type { Toast } from "../components/StatusBar";

const CUSTOM_SERIES_VALUE = "__custom";

export type DraftStatus = "clean" | "dirty" | "autosaved" | "published";

export interface PostMeta {
  title: string;
  date?: string;
  tags?: string;
  isPublic?: boolean;
  series?: string;
}

type EditorMode = "live" | "edit" | "preview";

/**
 * 后台编辑器的全部状态与操作（草稿自动保存、发布、删除、媒体上传等）。
 * 拆分自原 AdminClient，便于维护；AdminClient 只保留渲染。
 */
export function usePostEditor(
  token: string,
  addToast: (type: Toast["type"], message: string) => void
) {
  const { uploading, uploadError, upload } = useImageUpload(token);

  const [posts, setPosts] = useState<GitHubFile[]>([]);
  const [postTitles, setPostTitles] = useState<Record<string, string>>({});
  const [postMeta, setPostMeta] = useState<Record<string, PostMeta>>({});
  const [loading, setLoading] = useState(false);

  // editor state
  const [title, setTitle] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [dateInput, setDateInput] = useState(todayString());
  const [updatedInput, setUpdatedInput] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [seriesMode, setSeriesMode] = useState("");
  const [customSeriesTitle, setCustomSeriesTitle] = useState("");
  const [content, setContent] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("live");
  const [isPublic, setIsPublic] = useState(true);
  const [editingFile, setEditingFile] = useState<GitHubFile | null>(null);
  const [originalDate, setOriginalDate] = useState<string>("");
  const [publishIssues, setPublishIssues] = useState<string[]>([]);
  const [lastBackupKey, setLastBackupKey] = useState("");
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("clean");
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState("");
  const [savedDraftSignature, setSavedDraftSignature] = useState("");

  const tagSuggestions = useMemo(() => {
    const set = new Set<string>();
    Object.values(postMeta).forEach((meta) => {
      if ("tags" in meta && typeof meta.tags === "string") {
        parseTagList(meta.tags).forEach((tag) => set.add(tag));
      }
    });
    parseTagList(tags).forEach((tag) => set.add(tag));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }, [postMeta, tags]);

  const currentSlug = editingFile?.path.replace(/^posts\//, "").replace(/\.md$/, "")
    || normalizeSlug(slugInput)
    || "new";
  const currentDraftKey = `admin-draft-${currentSlug}`;

  // draft management
  const editorRef = useRef({ title, slugInput, dateInput, updatedInput, tags, description, seriesMode, customSeriesTitle, content, isPublic, draftKey: currentDraftKey });
  const hasUnsavedChanges = useRef(false);
  const publishRef = useRef<() => void>(() => {});
  const baselineDraft = useRef("");

  const currentDraftSignature = useMemo(() => draftSignature({
    title,
    slugInput,
    dateInput,
    updatedInput,
    tags,
    description,
    seriesMode,
    customSeriesTitle,
    content,
    isPublic,
  }), [
    title,
    slugInput,
    dateInput,
    updatedInput,
    tags,
    description,
    seriesMode,
    customSeriesTitle,
    content,
    isPublic,
  ]);

  const draftIssues = useMemo(() => {
    if (!title && !content && !tags && !description) return [];

    const editingSlug = editingFile?.path.replace(/^posts\//, "").replace(/\.md$/, "");
    const normalizedSlug = normalizeSlug(slugInput || slugify(title) || fallbackSlug());
    const issues = validatePostDraft({
      title,
      slug: normalizedSlug,
      date: dateInput,
      updated: updatedInput,
      tags,
      description,
      content,
      isPublic,
      existingSlugs: posts.map((post) => post.name.replace(/\.md$/, "")),
      editingSlug,
    });

    if (seriesMode === CUSTOM_SERIES_VALUE && !customSeriesTitle.trim()) {
      issues.push("自定义系列需要填写系列名称");
    }

    return issues;
  }, [
    title,
    content,
    tags,
    description,
    editingFile,
    slugInput,
    dateInput,
    updatedInput,
    isPublic,
    posts,
    seriesMode,
    customSeriesTitle,
  ]);

  const draftVisualStatus = useMemo<DraftStatus>(() => {
    const empty = !title && !content && !tags && !description;
    const matchesBaseline = Boolean(baselineDraft.current && currentDraftSignature === baselineDraft.current);
    const matchesAutosave = Boolean(savedDraftSignature && currentDraftSignature === savedDraftSignature);

    if (empty || matchesBaseline) return "clean";
    if (draftStatus === "published" && matchesBaseline) return "published";
    if (draftStatus === "autosaved" && matchesAutosave) return "autosaved";
    return "dirty";
  }, [
    draftStatus,
    title,
    content,
    tags,
    description,
    currentDraftSignature,
    savedDraftSignature,
  ]);

  const draftStatusText = useMemo(() => {
    if (loading) return "处理中";
    if (draftStatus === "published" && draftVisualStatus === "clean") return "已发布";
    if (draftVisualStatus === "autosaved") {
      return lastDraftSavedAt ? `已自动保存 ${lastDraftSavedAt}` : "已自动保存";
    }
    if (draftVisualStatus === "dirty") return "有未保存改动";
    return "无改动";
  }, [
    draftStatus,
    draftVisualStatus,
    lastDraftSavedAt,
    loading,
  ]);

  // load posts — 并发拉取所有文章内容
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPosts(token);
      setPosts(data);
      const titles: Record<string, string> = {};
      const meta: Record<string, PostMeta> = {};
      await Promise.all(
        data.map(async (file) => {
          try {
            const { content: raw } = await getPostContent(token, file.path);
            const { data: fm } = parseFrontmatter(raw);
            titles[file.path] = stringField(fm.title) || file.name.replace(".md", "");
            meta[file.path] = {
              title: stringField(fm.title),
              date: dateField(fm.date),
              tags: tagListField(fm.tags),
              isPublic: booleanField(fm.public, true),
              series: stringField(fm.series),
            };
          } catch {
            titles[file.path] = file.name.replace(".md", "");
          }
        })
      );
      setPostTitles((prev) => ({ ...prev, ...titles }));
      setPostMeta((prev) => ({ ...prev, ...meta }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [token, addToast]);

  // 在 effect 中同步 ref（不在 render 期间更新 ref，符合 react-hooks/refs 规则）
  useEffect(() => {
    editorRef.current = { title, slugInput, dateInput, updatedInput, tags, description, seriesMode, customSeriesTitle, content, isPublic, draftKey: currentDraftKey };
    hasUnsavedChanges.current = Boolean(
      (title || content || tags || description) &&
      (!baselineDraft.current || currentDraftSignature !== baselineDraft.current)
    );
    publishRef.current = handlePublish;
  });

  // 草稿自动保存 + 恢复提示
  useEffect(() => {
    const saved = localStorage.getItem(currentDraftKey);
    if (saved && !title && !content) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          queueMicrotask(() => {
            if (confirm("检测到未保存的草稿，是否恢复？")) {
              setTitle(draft.title || "");
              setSlugInput(draft.slugInput || "");
              setDateInput(draft.dateInput || todayString());
              setUpdatedInput(draft.updatedInput || "");
              setTags(draft.tags || "");
              setDescription(draft.description || "");
              setSeriesMode(draft.seriesMode || "");
              setCustomSeriesTitle(draft.customSeriesTitle || "");
              setContent(draft.content || "");
            } else {
              localStorage.removeItem(currentDraftKey);
            }
          });
        }
      } catch {}
    }
    const timer = setInterval(() => {
      const d = editorRef.current;
      if (d.title || d.content) {
        localStorage.setItem(d.draftKey, JSON.stringify(d));
        setSavedDraftSignature(draftSignature(d));
        setDraftStatus("autosaved");
        setLastDraftSavedAt(new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [currentDraftKey, content, title]);

  // beforeunload warning
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Ctrl+S shortcut — 监听只注册一次，通过 ref 调用最新 handlePublish
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        publishRef.current();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // show upload errors as toasts
  useEffect(() => {
    if (uploadError) addToast("error", uploadError);
  }, [uploadError, addToast]);

  function resetEditor() {
    baselineDraft.current = "";
    setTitle("");
    setSlugInput("");
    setDateInput(todayString());
    setUpdatedInput("");
    setTags("");
    setDescription("");
    setSeriesMode("");
    setCustomSeriesTitle("");
    setContent("");
    setIsPublic(true);
    setEditingFile(null);
    setOriginalDate("");
    setPublishIssues([]);
    setLastBackupKey("");
    setEditorMode("live");
    setShowMediaLibrary(false);
    setDraftStatus("clean");
    setLastDraftSavedAt("");
    setSavedDraftSignature("");
  }

  function restoreLastBackup() {
    if (!lastBackupKey) return;
    const raw = localStorage.getItem(lastBackupKey);
    if (!raw) {
      addToast("info", "没有可恢复的保存前备份");
      return;
    }
    try {
      const backup = JSON.parse(raw) as { previousContent?: string };
      if (!backup.previousContent) {
        addToast("error", "备份内容不完整");
        return;
      }
      const { data, body } = parseFrontmatter(backup.previousContent);
      setTitle(stringField(data.title));
      setDateInput(dateField(data.date) || todayString());
      setUpdatedInput(dateField(data.updated));
      setTags(tagListField(data.tags));
      setDescription(stringField(data.description));
      setIsPublic(booleanField(data.public, true));
      setContent(body);
      addToast("success", "已恢复最近一次保存前的内容");
    } catch {
      addToast("error", "备份解析失败");
    }
  }

  async function handleSelectPost(file: GitHubFile) {
    setLoading(true);
    try {
      const { content: raw, sha } = await getPostContent(token, file.path);
      const { data, body } = parseFrontmatter(raw);
      const slug = file.path.replace(/^posts\//, "").replace(/\.md$/, "");
      const nextTitle = stringField(data.title) || file.name.replace(".md", "");
      const nextDate = dateField(data.date) || todayString();
      const nextUpdated = dateField(data.updated);
      const nextTags = tagListField(data.tags);
      const nextDescription = stringField(data.description);
      const nextContent = body;
      let nextSeriesMode = "";
      let nextCustomSeriesTitle = "";
      const seriesRaw = stringField(data.series);
      if (seriesRaw) {
        const known = seriesDefinitions.find(
          (s) => s.slug === seriesRaw || s.title === seriesRaw
        );
        if (known) {
          nextSeriesMode = known.slug;
        } else {
          nextSeriesMode = CUSTOM_SERIES_VALUE;
          nextCustomSeriesTitle = stringField(data.seriesTitle) || seriesRaw;
        }
      }
      const nextIsPublic = booleanField(data.public, true);

      setTitle(nextTitle);
      setSlugInput(slug);
      setDateInput(nextDate);
      setUpdatedInput(nextUpdated);
      setTags(nextTags);
      setDescription(nextDescription);
      setSeriesMode(nextSeriesMode);
      setCustomSeriesTitle(nextCustomSeriesTitle);
      setIsPublic(nextIsPublic);
      setContent(nextContent);
      setOriginalDate(dateField(data.date));
      setEditingFile({ ...file, sha });
      setPublishIssues([]);
      setLastBackupKey(`admin-last-content-${slug}`);
      baselineDraft.current = draftSignature({
        title: nextTitle,
        slugInput: slug,
        dateInput: nextDate,
        updatedInput: nextUpdated,
        tags: nextTags,
        description: nextDescription,
        seriesMode: nextSeriesMode,
        customSeriesTitle: nextCustomSeriesTitle,
        content: nextContent,
        isPublic: nextIsPublic,
      });
      setDraftStatus("clean");
      setLastDraftSavedAt("");
      setSavedDraftSignature("");

      setPostTitles((prev) => {
        const next = { ...prev, [file.path]: nextTitle };
        return next;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载文章失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    const editingSlug = editingFile?.path.replace(/^posts\//, "").replace(/\.md$/, "");
    const normalizedSlug = normalizeSlug(slugInput || slugify(title) || fallbackSlug());
    const issues = draftIssues;

    setPublishIssues(issues);
    if (issues.length > 0) {
      addToast("error", `发布前检查未通过：${issues[0]}`);
      return;
    }

    const summary = [
      editingFile ? "更新已有文章" : "发布新文章",
      `slug: ${editingSlug || normalizedSlug}`,
      `标签: ${parseTagList(tags).join(", ") || "无"}`,
      `正文: ${content.trim().length} 字符`,
      isPublic ? "状态: 公开" : "状态: 私密",
    ].join("\n");

    if (!confirm(`确认保存？\n\n${summary}`)) {
      return;
    }

    setLoading(true);

    let selectedSeriesSlug = "";
    let selectedSeriesTitle = "";
    if (seriesMode === CUSTOM_SERIES_VALUE) {
      const t = customSeriesTitle.trim();
      if (t) {
        selectedSeriesSlug = createSeriesSlug(t);
        selectedSeriesTitle = t;
      }
    } else if (seriesMode) {
      const s = seriesDefinitions.find((item) => item.slug === seriesMode);
      if (s) {
        selectedSeriesSlug = s.slug;
        selectedSeriesTitle = s.title;
      }
    }

    const frontmatter = buildFrontmatter(
      title.trim(),
      tags.trim(),
      description.trim(),
      isPublic,
      selectedSeriesSlug,
      selectedSeriesTitle,
      dateInput || originalDate || undefined,
      editingFile ? updatedInput || todayString() : updatedInput || undefined
    );
    const fullContent = frontmatter + content.trimStart();

    try {
      let path: string;
      if (editingFile) {
        // 编辑已有文章：沿用原路径（不改 slug，避免断链）
        path = editingFile.path;
      } else {
        path = `posts/${normalizedSlug}.md`;
      }
      if (editingFile) {
        localStorage.setItem(
          `admin-last-content-${editingSlug}`,
          JSON.stringify({
            path,
            content: frontmatter + content.trimStart(),
            previousContent: (await getPostContent(token, editingFile.path)).content,
            savedAt: new Date().toISOString(),
          })
        );
        setLastBackupKey(`admin-last-content-${editingSlug}`);
      }
      await savePost(token, path, fullContent, editingFile?.sha);
      addToast("success", editingFile ? "文章已更新" : "文章已发布");
      localStorage.removeItem(currentDraftKey);
      localStorage.removeItem("admin-draft");
      setPostTitles((prev) => ({ ...prev, [path]: title.trim() }));
      baselineDraft.current = currentDraftSignature;
      setDraftStatus("published");
      setSavedDraftSignature(currentDraftSignature);
      setLastDraftSavedAt(new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }));
      await loadPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "保存失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  function insertMarkdown(markdown: string) {
    const textarea = document.querySelector(
      ".admin-editor-textarea"
    ) as HTMLTextAreaElement | null;
    const pos = textarea?.selectionStart;
    setContent((prev) => {
      if (pos != null) {
        return prev.slice(0, pos) + markdown + prev.slice(pos);
      }
      return prev + markdown;
    });
  }

  async function handleImageInsert(file: File) {
    const md = await upload(file);
    if (!md) return;
    insertMarkdown(md);
    addToast("success", "图片已上传并插入 Markdown");
  }

  function handlePaste(e: ClipboardEvent) {
    const image = Array.from(e.clipboardData.files || []).find((f) =>
      f.type.startsWith("image/")
    );
    if (image) {
      e.preventDefault();
      handleImageInsert(image);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const image = Array.from(e.dataTransfer.files || []).find((f) =>
      f.type.startsWith("image/")
    );
    if (image) handleImageInsert(image);
  }

  async function handleDelete() {
    if (!editingFile) return;
    if (!confirm(`确认删除「${title || editingFile.name}」？此操作不可撤销。`)) return;

    setLoading(true);
    try {
      await deletePost(token, editingFile.path, editingFile.sha);
      addToast("success", "文章已删除");
      resetEditor();
      await loadPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "删除失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  return {
    posts,
    postTitles,
    postMeta,
    loading,
    uploading,
    title,
    setTitle,
    slugInput,
    setSlugInput,
    dateInput,
    setDateInput,
    updatedInput,
    setUpdatedInput,
    tags,
    setTags,
    description,
    setDescription,
    seriesMode,
    setSeriesMode,
    customSeriesTitle,
    setCustomSeriesTitle,
    content,
    setContent,
    editorMode,
    setEditorMode,
    isPublic,
    setIsPublic,
    editingFile,
    publishIssues,
    lastBackupKey,
    showMediaLibrary,
    setShowMediaLibrary,
    draftStatusText,
    draftIssues,
    draftVisualStatus,
    draftStatus,
    tagSuggestions,
    currentSlug,
    loadPosts,
    resetEditor,
    restoreLastBackup,
    handleSelectPost,
    handlePublish,
    insertMarkdown,
    handleImageInsert,
    handlePaste,
    handleDrop,
    handleDelete,
  };
}
