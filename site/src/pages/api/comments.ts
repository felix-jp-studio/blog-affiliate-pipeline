export const prerender = false;

import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import {
  checkRateLimit,
  createPendingComment,
  getApprovedComments,
  isKvConfigured,
} from "../../lib/comments/kv-store";
import { getClientIp, hashClientIp } from "../../lib/comments/ip-hash";
import {
  sanitizeCommentText,
  validateCommentInput,
} from "../../lib/comments/validation";
import type { Comment } from "../../lib/comments/types";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function commentsEnabled(): boolean {
  return import.meta.env.PUBLIC_COMMENTS_ENABLED === "true";
}

export const GET: APIRoute = async ({ url }) => {
  if (!commentsEnabled()) {
    return jsonResponse({ comments: [] }, 200);
  }

  if (!isKvConfigured()) {
    return jsonResponse({ error: "Comments storage is not configured." }, 503);
  }

  const slug = url.searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return jsonResponse({ error: "slug is required." }, 400);
  }

  try {
    const comments = await getApprovedComments(slug);
    return jsonResponse({ comments }, 200);
  } catch {
    return jsonResponse({ error: "Failed to load comments." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!commentsEnabled()) {
    return jsonResponse({ error: "Comments are disabled." }, 403);
  }

  if (!isKvConfigured()) {
    return jsonResponse({ error: "Comments storage is not configured." }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  if (typeof payload.website === "string" && payload.website.trim()) {
    return jsonResponse(
      {
        ok: true,
        message: "コメントを受け付けました。承認後に公開されます。",
      },
      201,
    );
  }

  const input = {
    articleSlug: String(payload.articleSlug ?? ""),
    authorName: sanitizeCommentText(String(payload.authorName ?? "")),
    body: sanitizeCommentText(String(payload.body ?? "")),
  };

  const validationError = validateCommentInput(input);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }

  const salt = import.meta.env.COMMENTS_IP_SALT ?? "comments";
  const ipHash = hashClientIp(getClientIp(request), salt);

  if (ipHash) {
    const allowed = await checkRateLimit(ipHash, input.articleSlug);
    if (!allowed) {
      return jsonResponse(
        {
          error: "投稿回数の上限に達しました。しばらくしてからお試しください。",
        },
        429,
      );
    }
  }

  const comment: Comment = {
    id: randomUUID(),
    articleSlug: input.articleSlug,
    authorName: input.authorName,
    body: input.body,
    status: "pending",
    createdAt: new Date().toISOString(),
    ipHash,
  };

  try {
    await createPendingComment(comment);
    return jsonResponse(
      {
        ok: true,
        message: "コメントを受け付けました。承認後に公開されます。",
      },
      201,
    );
  } catch {
    return jsonResponse({ error: "Failed to save comment." }, 500);
  }
};
