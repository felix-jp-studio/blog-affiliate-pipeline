function initComments(root: Element, slug: string): void {
  const form = root.querySelector<HTMLFormElement>("[data-comment-form]");
  const listEl = root.querySelector("[data-comment-list]");
  const statusEl = root.querySelector("[data-comment-status]");
  const submitButton = root.querySelector<HTMLButtonElement>(
    "[data-submit-button]",
  );
  const btnLabel = submitButton?.querySelector<HTMLElement>(".btn-label");
  const btnLoading = submitButton?.querySelector<HTMLElement>(".btn-loading");
  if (!form) return;

  const validators: Record<string, (value: string) => string | null> = {
    authorName(value) {
      const trimmed = value.trim();
      if (!trimmed) return "お名前を入力してください。";
      if (trimmed.length > 32) {
        return "お名前は32文字以内で入力してください。";
      }
      return null;
    },
    body(value) {
      const trimmed = value.trim();
      if (!trimmed) return "コメントを入力してください。";
      if (trimmed.length < 10) {
        return "コメントは10文字以上で入力してください。";
      }
      if (trimmed.length > 1000) {
        return "コメントは1,000文字以内で入力してください。";
      }
      return null;
    },
  };

  const setFieldError = (field: string, message: string | null) => {
    const input = form.querySelector(`[name="${field}"]`);
    const errorEl = form.querySelector(`[data-field-error="${field}"]`);
    if (!input || !errorEl) return;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      errorEl.textContent = message;
      (errorEl as HTMLElement).hidden = false;
    } else {
      input.removeAttribute("aria-invalid");
      errorEl.textContent = "";
      (errorEl as HTMLElement).hidden = true;
    }
  };

  const validateField = (field: string) => {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${field}"]`,
    );
    if (!input) return true;
    const error = validators[field](input.value);
    setFieldError(field, error);
    return error === null;
  };

  const validateForm = () =>
    ["authorName", "body"].map(validateField).every(Boolean);

  const setStatus = (type: "success" | "error" | null, message = "") => {
    if (!statusEl) return;
    statusEl.classList.remove("is-success", "is-error");
    if (!type) {
      (statusEl as HTMLElement).hidden = true;
      statusEl.textContent = "";
      return;
    }
    (statusEl as HTMLElement).hidden = false;
    statusEl.textContent = message;
    statusEl.classList.add(type === "success" ? "is-success" : "is-error");
  };

  const setLoading = (loading: boolean) => {
    if (!submitButton || !btnLabel || !btnLoading) return;
    submitButton.disabled = loading;
    submitButton.setAttribute("aria-busy", loading ? "true" : "false");
    btnLabel.hidden = loading;
    btnLoading.hidden = !loading;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const renderComments = (
    comments: Array<{
      authorName: string;
      body: string;
      approvedAt?: string;
      createdAt: string;
    }>,
  ) => {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!comments.length) {
      const empty = document.createElement("li");
      empty.className = "comment-list__empty";
      empty.textContent =
        "まだコメントはありません。最初のコメントを投稿してください。";
      listEl.appendChild(empty);
      return;
    }
    for (const comment of comments) {
      const item = document.createElement("li");
      item.className = "comment-item";
      const meta = document.createElement("p");
      meta.className = "comment-item__meta";
      meta.textContent = `${comment.authorName} · ${formatDate(comment.approvedAt ?? comment.createdAt)}`;
      const body = document.createElement("p");
      body.className = "comment-item__body";
      body.textContent = comment.body;
      item.append(meta, body);
      listEl.appendChild(item);
    }
  };

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return;
      const data = await res.json();
      renderComments(data.comments ?? []);
    } catch {
      /* ignore load errors on static preview */
    }
  };

  for (const field of ["authorName", "body"]) {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${field}"]`,
    );
    input?.addEventListener("blur", () => validateField(field));
    input?.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setStatus(null);
    setLoading(true);

    const formData = new FormData(form);
    const payload = {
      articleSlug: slug,
      authorName: String(formData.get("authorName") ?? ""),
      body: String(formData.get("body") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error", data.error ?? "送信に失敗しました。");
        return;
      }
      form.reset();
      setStatus(
        "success",
        data.message ?? "コメントを受け付けました。承認後に公開されます。",
      );
    } catch {
      setStatus(
        "error",
        "送信に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  });

  void loadComments();
}

function deferInit(root: Element): void {
  const slug = root.getAttribute("data-article-slug");
  if (!slug) return;

  let initialized = false;
  const run = () => {
    if (initialized) return;
    initialized = true;
    initComments(root, slug);
  };

  if (typeof IntersectionObserver === "undefined") {
    run();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        run();
      }
    },
    { rootMargin: "200px 0px" },
  );
  observer.observe(root);
}

document
  .querySelectorAll("[data-article-comments]")
  .forEach((root) => deferInit(root));
