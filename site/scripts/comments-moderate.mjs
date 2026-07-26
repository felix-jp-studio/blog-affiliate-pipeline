#!/usr/bin/env node
/**
 * Moderate article comments stored in Vercel KV.
 *
 * Usage:
 *   COMMENTS_MODERATOR_TOKEN=... KV_REST_API_URL=... KV_REST_API_TOKEN=... \
 *     node scripts/comments-moderate.mjs list
 *   node scripts/comments-moderate.mjs approve <comment-id>
 *   node scripts/comments-moderate.mjs reject <comment-id>
 */
import { kv } from "@vercel/kv";

const COMMENT_KEY = (id) => `comment:${id}`;
const PENDING_KEY = "comments:pending";
const SLUG_KEY = (slug) => `comments:slug:${slug}`;

async function listPending() {
  const ids = (await kv.lrange(PENDING_KEY, 0, -1)) ?? [];
  if (ids.length === 0) {
    console.log("No pending comments.");
    return;
  }
  for (const id of ids) {
    const comment = await kv.get(COMMENT_KEY(id));
    if (!comment) continue;
    console.log(`${comment.id}\t${comment.articleSlug}\t${comment.authorName}\t${comment.createdAt}`);
    console.log(`  ${comment.body.slice(0, 120)}${comment.body.length > 120 ? "…" : ""}`);
  }
}

async function setStatus(id, status) {
  const comment = await kv.get(COMMENT_KEY(id));
  if (!comment || comment.status !== "pending") {
    console.error(`Comment not found or not pending: ${id}`);
    process.exit(1);
  }
  const updated = {
    ...comment,
    status,
    approvedAt: status === "approved" ? new Date().toISOString() : undefined,
  };
  await kv.set(COMMENT_KEY(id), updated);
  await kv.lrem(PENDING_KEY, 0, id);
  if (status === "approved") {
    await kv.rpush(SLUG_KEY(comment.articleSlug), id);
  }
  console.log(`${status}: ${id} (${comment.articleSlug})`);
}

const [command, id] = process.argv.slice(2);

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error("KV_REST_API_URL and KV_REST_API_TOKEN are required.");
  process.exit(1);
}

if (command === "list") {
  await listPending();
} else if (command === "approve" && id) {
  await setStatus(id, "approved");
} else if (command === "reject" && id) {
  await setStatus(id, "rejected");
} else {
  console.error("Usage: comments-moderate.mjs list|approve <id>|reject <id>");
  process.exit(1);
}
