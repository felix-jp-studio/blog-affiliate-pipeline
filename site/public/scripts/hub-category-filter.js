const grid = document.querySelector("[data-category-grid]");
if (grid) {
  const items = Array.from(grid.querySelectorAll("[data-article-type]"));
  const chips = Array.from(document.querySelectorAll(".category-filter-chip"));

  const applyFilter = (filter) => {
    items.forEach((item) => {
      const type = item.dataset.articleType;
      const visible = filter === "all" || type === filter;
      item.hidden = !visible;
    });

    chips.forEach((chip) => {
      const isActive = chip.dataset.filter === filter;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      applyFilter(chip.dataset.filter ?? "all");
    });
  });
}
