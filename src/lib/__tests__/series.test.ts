import { describe, it, expect } from "vitest";
import { getSortedPostsData } from "../posts";
import {
  getPostSeriesPosition,
  getPostsBySeries,
  getSeriesBySlug,
  getSeriesNeighbors,
  getSeriesSummaries,
} from "../series";

describe("series 数据层", () => {
  it("getSeriesSummaries 返回完整结构且计数一致", () => {
    const summaries = getSeriesSummaries();
    expect(summaries.length).toBeGreaterThan(0);
    for (const s of summaries) {
      expect(s.slug).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(Array.isArray(s.posts)).toBe(true);
      expect(s.postCount).toBe(s.posts.length);
      expect(s.posts.every((p) => p.public)).toBe(true);
    }
  });

  it("getSeriesBySlug 可反查，未知 slug 返回 undefined", () => {
    const summaries = getSeriesSummaries();
    const found = getSeriesBySlug(summaries[0].slug);
    expect(found).toBeDefined();
    expect(getSeriesBySlug("no-such-series")).toBeUndefined();
  });

  it("getPostsBySeries 返回该系列文章", () => {
    const summaries = getSeriesSummaries().filter((s) => s.postCount > 0);
    if (summaries.length === 0) return;
    const posts = getPostsBySeries(summaries[0]);
    expect(posts.length).toBe(summaries[0].postCount);
  });

  it("getPostSeriesPosition 对系列文章返回 1-based 位置", () => {
    const summaries = getSeriesSummaries().filter((s) => s.postCount > 0);
    if (summaries.length === 0) return;
    const post = summaries[0].posts[0];
    const position = getPostSeriesPosition(post);
    expect(position).not.toBeNull();
    expect(position!.index).toBeGreaterThanOrEqual(1);
    expect(position!.total).toBe(summaries[0].postCount);
  });

  it("getSeriesNeighbors 对未入系列的文章返回空", () => {
    const posts = getSortedPostsData();
    const orphan = posts.find((p) => !getPostSeriesPosition(p));
    if (!orphan) return;
    expect(getSeriesNeighbors(orphan)).toEqual({ prev: null, next: null });
  });
});
