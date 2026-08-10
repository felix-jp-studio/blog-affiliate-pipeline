function initBackToTop(): void {
  const button = document.querySelector<HTMLButtonElement>(
    ".article-back-to-top",
  );
  if (!button) return;

  const showAfterPx = 480;

  const syncVisibility = (): void => {
    const shouldShow = window.scrollY > showAfterPx;
    button.hidden = !shouldShow;
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", syncVisibility, { passive: true });
  syncVisibility();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBackToTop, { once: true });
} else {
  initBackToTop();
}
