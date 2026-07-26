import { kv } from "@vercel/kv";
import type { Comment, CommentStatus, PublicComment } from "./types";

const COMMENT_KEY = (id: string) => `comment:${id}`;
const PENDING_KEY = "comments:pending";
const SLUG_KEY = (slug: string) => `comments:slug:${slug}`;
const RATE_KEY = (ipHash: string, slug: string) =>
  `ratelimit:${ipHash}:${slug}`;

const RATE_LIMIT = 3;
const RATE_TTL_SECONDS = 60 * 60;

export function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getApprovedComments(
  slug: string,
): Promise<PublicComment[]> {
  const ids = (await kv.lrange<string>(SLUG_KEY(slug), 0, -1)) ?? [];
  if (ids.length === 0) return [];

  const comments = await Promise.all(
    ids.map((id) => kv.get<Comment>(COMMENT_KEY(id))),
  );

  return comments
    .filter((c): c is Comment => c != null && c.status === "approved")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toPublicComment);
}

export async function createPendingComment(
  comment: Comment,
): Promise<void> {
  await kv.set(COMMENT_KEY(comment.id), comment);
  await kv.lpush(PENDING_KEY, comment.id);
}

export async function checkRateLimit(
  ipHash: string,
  slug: string,
): Promise<boolean> {
  const key = RATE_KEY(ipHash, slug);
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, RATE_TTL_SECONDS);
  }
  return count <= RATE_LIMIT;
}

export async function getComment(id: string): Promise<Comment | null> {
  return (await kv.get<Comment>(COMMENT_KEY(id))) ?? null;
}

export async function listCommentsByStatus(
  status: CommentStatus,
): Promise<Comment[]> {
  if (status === "pending") {
    const ids = (await kv.lrange<string>(PENDING_KEY, 0, -1)) ?? [];
    const comments = await Promise.all(ids.map((id) => getComment(id)));
    return comments.filter(
      (c): c is Comment => c != null && c.status === "pending",
    );
  }

  return [];
}

export async function setCommentStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<Comment | null> {
  const comment = await getComment(id);
  if (!comment || comment.status !== "pending") {
    return null;
  }

  const updated: Comment = {
    ...comment,
    status,
    approvedAt: status === "approved" ? new Date().toISOString() : undefined,
  };

  await kv.set(COMMENT_KEY(id), updated);
  await kv.lrem(PENDING_KEY, 0, id);

  if (status === "approved") {
    await kv.rpush(SLUG_KEY(comment.articleSlug), id);
  }

  return updated;
}

function toPublicComment(comment: Comment): PublicComment {
  return {
    id: comment.id,
    authorName: comment.authorName,
    body: comment.body,
    createdAt: comment.createdAt,
    approvedAt: comment.approvedAt,
  };
}
