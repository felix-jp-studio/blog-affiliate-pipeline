# 構成生成プロンプト（格安 SIM / 光回線 / お困り系）

{{SYSTEM_COMMON}}

あなたは通信系メディアの編集者です。以下のキーワードで記事構成を **JSON のみ** で出力してください。

## 入力

- キーワード: {{KEYWORD}}
- 記事タイプ: {{ARTICLE_TYPE}}
- カテゴリ: {{CATEGORY}}

## 出力形式（JSON のみ、他の文字は出力しない）

```json
{
  "title": "30〜45字のタイトル",
  "slug": "ascii-hyphen-slug",
  "metaDescription": "80〜120字",
  "category": "sim|hikari|trouble",
  "articleType": "comparison|howto|troubleshoot",
  "h2": [
    {
      "heading": "見出し",
      "h3": ["小見出し1", "小見出し2"],
      "goal": "この節で答える読者の疑問"
    }
  ],
  "tables": [
    {
      "id": "price",
      "columns": ["キャリア", "月額目安", "データ容量", "通話", "備考"],
      "rowsHint": "5社以上。料金は要公式確認"
    }
  ],
  "ctaCarriers": ["rakuten-mobile", "linemo", "ahamo"],
  "disclaimer": ["料金は公式で要確認", "キャンペーンは変動"]
}
```

## タイプ別必須 H2

### comparison

結論サマリ / 比較の見方 / 料金比較表 / 向いている人 / 乗り換えの流れ / 注意点 / FAQ

### howto

事前準備 / 手順 / 所要時間 / つまずきポイント / 完了後チェック / FAQ

### troubleshoot

症状の切り分け / 原因候補 / 対処ステップ / 問い合わせが必要なケース / 予防 / FAQ

## 制約

- 景表法リスク表現（絶対お得等）は禁止
- 虚偽の体験談は書かない
