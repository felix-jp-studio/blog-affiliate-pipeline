interface UnlockPayload {
  html?: string;
  restoreCode?: string;
  pending?: boolean;
  error?: string;
}

function initPaywall(root: HTMLElement, slug: string): void {
  const lockEl = root.querySelector<HTMLElement>("[data-paywall-lock]");
  const unlockedEl = root.querySelector<HTMLElement>("[data-paywall-unlocked]");
  const bodyEl = root.querySelector<HTMLElement>("[data-paywall-body]");
  const statusEl = root.querySelector<HTMLElement>("[data-paywall-status]");
  const buyButton = root.querySelector<HTMLButtonElement>("[data-paywall-buy]");
  const restoreForm = root.querySelector<HTMLFormElement>(
    "[data-paywall-restore]",
  );
  const receiptEl = root.querySelector<HTMLElement>("[data-paywall-receipt]");
  const codeEl = root.querySelector<HTMLElement>("[data-paywall-code]");

  if (!lockEl || !unlockedEl || !bodyEl) return;

  function showStatus(message: string): void {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = false;
  }

  function clearStatus(): void {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.hidden = true;
  }

  /** justPurchased のときだけ復元コードを開いた状態で見せる。 */
  function unlock(
    html: string,
    restoreCode?: string,
    justPurchased = false,
  ): void {
    bodyEl!.innerHTML = html;
    lockEl!.hidden = true;
    unlockedEl!.hidden = false;

    if (restoreCode && receiptEl && codeEl) {
      codeEl.textContent = restoreCode;
      receiptEl.hidden = false;
      if (justPurchased && receiptEl instanceof HTMLDetailsElement) {
        receiptEl.open = true;
      }
    }
  }

  /** 再訪時: cookie を持っていれば黙って本文を差し込む。 */
  async function loadPurchased(): Promise<void> {
    try {
      const response = await fetch(
        `/api/paywall/content?slug=${encodeURIComponent(slug)}`,
        { credentials: "same-origin" },
      );
      if (!response.ok) return;

      const payload = (await response.json()) as UnlockPayload;
      if (payload.html) unlock(payload.html, payload.restoreCode);
    } catch {
      // 未購入時は無料パートのままで問題ないので黙って諦める
    }
  }

  /** 決済直後: Stripe から戻ってきた session_id を購入証明として解放する。 */
  async function redeemCheckoutSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(
        `/api/paywall/unlock?slug=${encodeURIComponent(slug)}&session_id=${encodeURIComponent(sessionId)}`,
        { credentials: "same-origin" },
      );
      const payload = (await response.json()) as UnlockPayload;

      if (payload.pending) {
        showStatus(
          "お支払い手続きを受け付けました。入金が確認できしだい自動で読めるようになります。このページを再度開いてご確認ください。",
        );
        return;
      }
      if (!response.ok || !payload.html) {
        showStatus(
          "購入の確認に失敗しました。決済が完了している場合は、時間をおいて再読み込みしてください。",
        );
        return;
      }
      unlock(payload.html, payload.restoreCode, true);
    } catch {
      showStatus(
        "購入の確認に失敗しました。通信環境を確認して再読み込みしてください。",
      );
    }
  }

  buyButton?.addEventListener("click", async () => {
    clearStatus();
    buyButton.disabled = true;

    try {
      const response = await fetch("/api/paywall/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ slug }),
      });
      const payload = (await response.json()) as {
        url?: string;
        alreadyPurchased?: boolean;
        error?: string;
      };

      if (payload.alreadyPurchased) {
        await loadPurchased();
        return;
      }
      if (!response.ok || !payload.url) {
        showStatus(
          "決済ページを開けませんでした。時間をおいて再度お試しください。",
        );
        return;
      }
      window.location.assign(payload.url);
    } catch {
      showStatus("決済ページを開けませんでした。通信環境を確認してください。");
    } finally {
      buyButton.disabled = false;
    }
  });

  restoreForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();

    const code = new FormData(restoreForm).get("code");
    if (typeof code !== "string" || code.trim() === "") {
      showStatus("復元コードを入力してください。");
      return;
    }

    try {
      const response = await fetch("/api/paywall/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        showStatus("復元コードを確認できませんでした。入力をご確認ください。");
        return;
      }
      await loadPurchased();
    } catch {
      showStatus("復元に失敗しました。通信環境を確認してください。");
    }
  });

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("pw_session");

  if (sessionId) {
    // 決済 ID を URL に残さない（共有・履歴経由での再利用を防ぐ）
    params.delete("pw_session");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
    void redeemCheckoutSession(sessionId);
  } else {
    void loadPurchased();
  }
}

for (const root of document.querySelectorAll<HTMLElement>(
  "[data-article-paywall]",
)) {
  const slug = root.dataset.articleSlug;
  if (slug) initPaywall(root, slug);
}
