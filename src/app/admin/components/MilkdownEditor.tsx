"use client";

import { useEffect, useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import { insert, replaceAll } from "@milkdown/kit/utils";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/classic.css";

export interface MilkdownEditorApi {
  /** 在光标处插入 markdown（图片/媒体库插入用） */
  insertMarkdown: (markdown: string) => void;
  focus: () => void;
}

interface MilkdownEditorProps {
  /** 当前 markdown 内容（外部受控） */
  value: string;
  onChange: (markdown: string) => void;
  /** 图片上传：返回图片 URL（粘贴/拖拽/工具栏上传都会走这里） */
  onUploadImage: (file: File) => Promise<string>;
  /** 暴露编辑器实例操作（由父组件通过 ref 调用） */
  apiRef?: React.RefObject<MilkdownEditorApi | null>;
}

/**
 * 基于 Milkdown Crepe 的所见即所得 Markdown 编辑器。
 * 自带工具栏、Slash 菜单、块编辑、图片上传、代码块（CodeMirror）等。
 */
export default function MilkdownEditor({
  value,
  onChange,
  onUploadImage,
  apiRef,
}: MilkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const readyRef = useRef(false);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onUploadRef = useRef(onUploadImage);

  // 在 effect 中同步 ref（不在 render 期间更新 ref，符合 react-hooks/refs 规则）
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    onUploadRef.current = onUploadImage;
  });

  // 创建编辑器（仅一次）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const crepe = new Crepe({
      root: container,
      defaultValue: valueRef.current,
      features: {
        [CrepeFeature.AI]: false,
        [CrepeFeature.TopBar]: false,
        [CrepeFeature.Latex]: false,
      },
      featureConfigs: {
        [CrepeFeature.ImageBlock]: {
          onUpload: async (file) => onUploadRef.current(file),
        },
      },
    });

    crepe.on((api) => {
      api.markdownUpdated((_ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          onChangeRef.current(markdown);
        }
      });
    });

    crepeRef.current = crepe;
    let alive = true;
    void crepe.create().then(() => {
      if (!alive) {
        void crepe.destroy();
        return;
      }
      readyRef.current = true;
    });

    return () => {
      alive = false;
      readyRef.current = false;
      void crepe.destroy();
      crepeRef.current = null;
    };
  }, []);

  // 外部 value 变化（切换文章/恢复草稿/撤销保存）时同步进编辑器
  useEffect(() => {
    const crepe = crepeRef.current;
    if (!crepe || !readyRef.current) return;
    try {
      if (value !== crepe.getMarkdown()) {
        crepe.editor.action(replaceAll(value));
      }
    } catch {
      // 编辑器尚未就绪时忽略，首次挂载由 defaultValue 承载
    }
  }, [value]);

  // 暴露实例操作（每次渲染刷新，保持引用最新）
  useEffect(() => {
    if (apiRef) {
      apiRef.current = {
        insertMarkdown: (markdown) => {
          const crepe = crepeRef.current;
          if (!crepe || !readyRef.current) return;
          try {
            crepe.editor.action(insert(markdown));
          } catch {
            // 忽略
          }
        },
        focus: () => {
          const crepe = crepeRef.current;
          if (!crepe || !readyRef.current) return;
          try {
            crepe.editor.action((ctx) => ctx.get(editorViewCtx).focus());
          } catch {
            // 忽略
          }
        },
      };
    }
  });

  return (
    <div
      ref={containerRef}
      className="milkdown-crepe h-full overflow-y-auto overscroll-contain"
    />
  );
}
