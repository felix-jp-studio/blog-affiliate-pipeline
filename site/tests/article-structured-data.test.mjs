import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildFaqPageJsonLd,
  buildHowToJsonLd,
  extractArticleStructuredData,
} from "../src/utils/article-structured-data.ts";

const sampleHowToBody = `
## 乗り換え手順

1. 公式サイトでプランを選ぶ
2. MNP予約番号を入力する
3. 本人確認書類をアップロードする

## よくある質問

### eSIMと物理SIMどちらがよいですか？

端末対応と開通の早さで選びます。

### 店舗で手続きできますか？

オンライン中心です。

> 本記事は AI 支援により作成されています。

## 編集部メモ: 手順の情報の確認方法

1. これは手順ではない
`;

describe("extractArticleStructuredData", () => {
  it("extracts FAQ items from よくある質問 section", () => {
    const { faq } = extractArticleStructuredData(sampleHowToBody);

    assert.equal(faq.length, 2);
    assert.equal(faq[0].question, "eSIMと物理SIMどちらがよいですか？");
    assert.match(faq[0].answer, /端末対応/);
  });

  it("extracts numbered steps from hand順 section", () => {
    const { steps } = extractArticleStructuredData(sampleHowToBody);

    assert.equal(steps.length, 3);
    assert.equal(steps[0].name, "公式サイトでプランを選ぶ");
    assert.equal(steps[2].name, "本人確認書類をアップロードする");
  });

  it("ignores numbered lists in 編集部メモ sections", () => {
    const { steps } = extractArticleStructuredData(sampleHowToBody);

    assert.equal(steps.length, 3);
  });
});

describe("buildFaqPageJsonLd", () => {
  it("returns FAQPage schema when FAQ items exist", () => {
    const { faq } = extractArticleStructuredData(sampleHowToBody);
    const jsonLd = buildFaqPageJsonLd(faq);

    assert.equal(jsonLd?.["@type"], "FAQPage");
    assert.equal(Array.isArray(jsonLd?.mainEntity), true);
    assert.equal(jsonLd?.mainEntity.length, 2);
  });

  it("returns null when FAQ items are empty", () => {
    assert.equal(buildFaqPageJsonLd([]), null);
  });
});

describe("buildHowToJsonLd", () => {
  it("returns HowTo schema when steps exist", () => {
    const { steps } = extractArticleStructuredData(sampleHowToBody);
    const jsonLd = buildHowToJsonLd("テスト記事", "説明文", steps);

    assert.equal(jsonLd?.["@type"], "HowTo");
    assert.equal(jsonLd?.name, "テスト記事");
    assert.equal(jsonLd?.description, "説明文");
    assert.equal(jsonLd?.step.length, 3);
    assert.equal(jsonLd?.step[0].position, 1);
  });

  it("returns null when steps are empty", () => {
    assert.equal(buildHowToJsonLd("テスト", "説明", []), null);
  });
});
