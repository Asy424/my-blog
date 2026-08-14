/** 文章列表每页数量 */
export const POSTS_PER_PAGE = 8;

export function getTotalPages(totalPosts: number): number {
  return Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
}

export function getPagePosts<T>(posts: T[], page: number): T[] {
  return posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
}
