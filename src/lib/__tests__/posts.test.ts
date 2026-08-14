import { describe, it, expect } from "vitest";
import {
  getAllTags,
  getBacklinks,
  getPostBySlug,
  getPostNeighbors,
  getPostsByTag,
  getRelatedPosts,
  getSortedPostsData,
} from "../posts";

describe("posts 数据层（基于真实 posts/ 目录）", () => {
  it("公开文章按日期倒序排列", () => {
    const posts = getSortedPostsData();
    expect(posts.length).toBeGreaterThan(0);
    const dates = posts.map((p) => p.date);
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : -1));
    expect(dates).toEqual(sorted);
  });

  it("每条记录字段完整", () => {
    for (const post of getSortedPostsData()) {
      expect(post.slug).toBeTruthy();
      expect(post.title).toBeTruthy();
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(post.tags)).toBe(true);
      expect(typeof post.public).toBe("boolean");
      expect(post.public).toBe(true);
    }
  });

  it("includePrivate 时数量不少于公开数量", () => {
    const all = getSortedPostsData(true);
    const publicPosts = getSortedPostsData(false);
    expect(all.length).toBeGreaterThanOrEqual(publicPosts.length);
  });

  it("getPostBySlug 返回文章正文，未知 slug 返回 null", () => {
    const posts = getSortedPostsData();
    const first = getPostBySlug(posts[0].slug);
    expect(first).not.toBeNull();
    expect(typeof first?.content).toBe("string");

    expect(getPostBySlug("no-such-post-xyz")).toBeNull();
  });

  it("getAllTags 返回去重排序的字符串数组", () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags.every((t) => typeof t === "string" && t.length > 0)).toBe(true);
  });

  it("getPostsByTag 的文章都包含该标签", () => {
    const tags = getAllTags();
    const posts = getPostsByTag(tags[0]);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((p) => p.tags.includes(tags[0]))).toBe(true);
  });

  it("getPostNeighbors 前后文章不重复", () => {
    const posts = getSortedPostsData();
    const { prev, next } = getPostNeighbors(posts[0].slug);
    if (prev && next) {
      expect(prev.slug).not.toBe(next.slug);
    }
  });

  it("getRelatedPosts 不包含自身", () => {
    const posts = getSortedPostsData();
    const related = getRelatedPosts(posts[0], 3);
    expect(related.every((p) => p.slug !== posts[0].slug)).toBe(true);
    expect(related.length).toBeLessThanOrEqual(3);
  });

  it("getBacklinks 返回结构正确的文章", () => {
    const posts = getSortedPostsData();
    const backlinks = getBacklinks(posts[0].slug);
    expect(backlinks.every((p) => p.public)).toBe(true);
  });
});
