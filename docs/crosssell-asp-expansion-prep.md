# crosssell ASP 化 — 実装側プレースホルダ（User 調査待ち）

## 状態

**ブロック中**: User の ASP 調査結果（電気・クレカの trackingUrl）が未共有。  
Agent は **アフィリエイト tracking URL を発明しない**。

## 置き場

| ファイル                               | 役割                                     |
| -------------------------------------- | ---------------------------------------- |
| `config/crosssell-asp-candidates.json` | 候補 ID・公式 URL・空の tracking 欄      |
| `config/prompts/article-crosssell.md`  | ASP 化後の `{AFFILIATE:…}` フック注記    |
| `config/asp-urls.json`                 | **調査完了後**に programs を active 追加 |

## User 作業チェックリスト

1. [ ] A8.net（https://pub.a8.net/）で「でんき / 電気 / 電力」案件を検索
2. [ ] バリューコマース（https://aff.valuecommerce.ne.jp/）で同様に検索
3. [ ] もしも（https://af.moshimo.com/af/s/）で非通信の電気・クレカを確認
4. [ ] 提携可能な案件の **programId / trackingUrl** を Agent に共有（スクショ可）
5. [ ] クレカは案件名を特定してから共有（未特定のまま URL を作らない）

## Agent 作業（調査結果受領後）

1. `asp-urls.json` に `status: active` で登録
2. `crosssell-asp-candidates.json` を `researchStatus: done` に更新
3. crosssell 記事 / プロンプトで `{AFFILIATE:au-denki}` 等を有効化
4. `validate-articles` + E2E affiliate 通過を確認

## 関連 KW

`data/keywords.sunday.csv` の電気・セット割系（auでんき / 楽天でんき 等）。
