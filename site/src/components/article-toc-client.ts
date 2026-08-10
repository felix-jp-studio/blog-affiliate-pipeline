function initArticleToc(): void {
  const mobileToc = document.querySelector<HTMLDetailsElement>(
    ".article-toc--mobile",
  );
  const summary = mobileToc?.querySelector<HTMLElement>(
    ".article-toc__summary",
  );

  if (mobileToc && summary) {
    const syncExpanded = (): void => {
      summary.setAttribute("aria-expanded", String(mobileToc.open));
    };

    mobileToc.addEventListener("toggle", syncExpanded);
    syncExpanded();

    mobileToc.querySelectorAll("a[data-toc-link]").forEach((link) => {
      link.addEventListener("click", () => {
        mobileToc.open = false;
        syncExpanded();
      });
    });
  }

  const tocLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"),
  );
  if (tocLinks.length === 0) return;

  const headingIds = tocLinks
    .map((link) => link.dataset.tocLink)
    .filter(Boolean);
  const headings = headingIds
    .map((id) => document.getElementById(id ?? ""))
    .filter((node): node is HTMLElement => node !== null);

  if (headings.length === 0) return;

  const setActive = (id: string | null): void => {
    tocLinks.forEach((link) => {
      const isActive = link.dataset.tocLink === id;
      if (isActive) {
        link.setAttribute("data-toc-active", "true");
      } else {
        link.removeAttribute("data-toc-active");
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            headings.indexOf(a.target as HTMLElement) -
            headings.indexOf(b.target as HTMLElement),
        );

      if (visible.length > 0) {
        setActive(visible[0].target.id);
        return;
      }

      const firstAbove = headings.find(
        (heading) => heading.getBoundingClientRect().top > 0,
      );
      if (firstAbove) {
        const index = Math.max(0, headings.indexOf(firstAbove) - 1);
        setActive(headings[index]?.id ?? null);
      }
    },
    {
      rootMargin: "-20% 0px -65% 0px",
      threshold: 0,
    },
  );

  headings.forEach((heading) => observer.observe(heading));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initArticleToc, { once: true });
} else {
  initArticleToc();
}
