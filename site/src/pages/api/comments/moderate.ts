export const prerender = false;

import type { APIRoute } from "astro";
import {
  isKvConfigured,
  listCommentsByStatus,
  setCommentStatus,
} from "../../../lib/comments/kv-store";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(request: Request): boolean {
  const token = import.meta.env.COMMENTS_MODERATOR_TOKEN;
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
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

  const action = String(payload.action ?? "");
  const id = String(payload.id ?? "").trim();

  if (action === "list") {
    const status =
      payload.status === "approved" || payload.status === "rejected"
        ? payload.status
        : "pending";
    if (status !== "pending") {
      return jsonResponse({ error: "Only pending list is supported." }, 400);
    }
    try {
      const comments = await listCommentsByStatus("pending");
      return jsonResponse({ comments }, 200);
    } catch {
      return jsonResponse({ error: "Failed to list comments." }, 500);
    }
  }

  if (!id) {
    return jsonResponse({ error: "id is required." }, 400);
  }

  if (action !== "approve" && action !== "reject") {
    return jsonResponse({ error: "action must be approve or reject." }, 400);
  }

  try {
    const updated = await setCommentStatus(
      id,
      action === "approve" ? "approved" : "rejected",
    );
    if (!updated) {
      return jsonResponse({ error: "Comment not found or not pending." }, 404);
    }
    return jsonResponse({ comment: updated }, 200);
  } catch {
    return jsonResponse({ error: "Failed to update comment." }, 500);
  }
};
