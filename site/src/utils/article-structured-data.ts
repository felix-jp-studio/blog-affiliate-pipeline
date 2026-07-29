export type FaqItem = {
  question: string;
  answer: string;
};

export type HowToStep = {
  name: string;
};

export type ArticleStructuredData = {
  faq: FaqItem[];
  steps: HowToStep[];
};

const FAQ_SECTION_TITLES = /^(よくある質問|FAQ)$/;

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\{AFFILIATE:[^}]+\}/g, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitH2Sections(body: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = [];
  const lines = body.split("\n");
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentTitle || currentLines.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentLines.join("\n").trim(),
        });
      }
      currentTitle = h2Match[1].trim();
      currentLines = [];
      continue;
    }

    currentLines.push(line);
  }

  if (currentTitle || currentLines.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentLines.join("\n").trim(),
    });
  }

  return sections;
}

function isHowToSectionTitle(title: string): boolean {
  if (title.startsWith("編集部メモ")) {
    return false;
  }

  return title.endsWith("手順") || title.endsWith("ステップ");
}

function extractFaqFromSection(content: string): FaqItem[] {
  const items: FaqItem[] = [];
  const lines = content.split("\n");
  let index = 0;

  while (index < lines.length) {
    const headingMatch = lines[index].match(/^### (.+)$/);
    if (!headingMatch) {
      index += 1;
      continue;
    }

    const question = headingMatch[1].trim();
    index += 1;
    const answerLines: string[] = [];

    while (index < lines.length) {
      const line = lines[index];
      if (
        /^### /.test(line) ||
        /^## /.test(line) ||
        /^> /.test(line) ||
        /^<!--/.test(line)
      ) {
        break;
      }

      if (line.trim()) {
        answerLines.push(line);
      } else if (answerLines.length > 0) {
        break;
      }

      index += 1;
    }

    const answer = stripInlineMarkdown(answerLines.join(" "));
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items;
}

function extractStepsFromSection(content: string): HowToStep[] {
  const steps: HowToStep[] = [];

  for (const line of content.split("\n")) {
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (!match) {
      continue;
    }

    const name = stripInlineMarkdown(match[1].trim());
    if (name) {
      steps.push({ name });
    }
  }

  return steps;
}

export function extractArticleStructuredData(body: string): ArticleStructuredData {
  const sections = splitH2Sections(body);
  const faq = sections
    .filter((section) => FAQ_SECTION_TITLES.test(section.title))
    .flatMap((section) => extractFaqFromSection(section.content));
  const steps = sections
    .filter((section) => isHowToSectionTitle(section.title))
    .flatMap((section) => extractStepsFromSection(section.content));

  return { faq, steps };
}

export function buildFaqPageJsonLd(faq: FaqItem[]): Record<string, unknown> | null {
  if (faq.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildHowToJsonLd(
  title: string,
  description: string,
  steps: HowToStep[],
): Record<string, unknown> | null {
  if (steps.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.name,
    })),
  };
}
