# 光回線 料金スクレイパー v0 — 設計

## 目的

公式料金ページの変更を検知し、比較記事の **料金表・キャンペーン表記** を鮮度維持する。Month 2 収益ロードマップ「NURO / 光回線 料金改定スクレイパー v0」の実装起点。

## スコープ（v0）

| 項目                                        | v0  | v1 以降  |
| ------------------------------------------- | --- | -------- |
| HTTP GET + 死活                             | ✅  | —        |
| HTML パース（月額・工事費）                 | —   | ✅       |
| `data/hikari-prices-snapshot.json` 書き込み | —   | ✅       |
| 差分 → リライト PR                          | —   | ✅       |
| Playwright（JS 描画ページ）                 | —   | 要否調査 |

## 対象プロバイダ（初期）

| key               | URL                                       | 記事 relevance         |
| ----------------- | ----------------------------------------- | ---------------------- |
| `nuro-hikari`     | https://nuro-hikari.com/                  | nuro-hikari-* 比較記事 |
| `au-hikari`       | https://www.au.com/internet/              | au-hikari-*            |
| `softbank-hikari` | https://www.softbank.jp/internet/         | softbank-hikari-*      |
| `docomo-hikari`   | https://www.docomo.ne.jp/internet/hikari/ | docomo-hikari-*        |

## 実行方式（提案）

### GitHub Actions（推奨）

```yaml
# .github/workflows/hikari-price-scraper.yml（v1 で追加）
schedule:
  - cron: "0 15 1 * *" # 毎月1日 00:00 JST = UTC 前日15:00
workflow_dispatch:
```

1. `packages/scraper` で venv + `pip install -r requirements.txt`
2. `python -m scraper.hikari_prices --dry-run` → artifact JSON
3. v1: 前回 snapshot と diff → 変更あれば Issue or リライトキュー追記

### ローカル / cron（代替）

```bash
0 9 1 * * cd /path/to/blog-affiliate-pipeline/packages/scraper && \
  .venv/bin/python -m scraper.hikari_prices >> /var/log/hikari-scraper.log 2>&1
```

## データモデル（v1 草案）

```json
{
  "version": "1",
  "updatedAt": "2026-08-01T00:00:00Z",
  "providers": {
    "nuro-hikari": {
      "monthlyFeeYen": 5200,
      "constructionFeeYen": 0,
      "campaignNote": "..."
    }
  }
}
```

## 連携

- **rewrite-queue**: 料金差分検知 → `data/rewrite-queue.csv` に slug + notes
- **generator**: 比較表テンプレに snapshot 値を注入（将来）
- **E2E**: 公式 URL 200 smoke（既存 production smoke と分離）

## リスク

| リスク             | 緩和                                          |
| ------------------ | --------------------------------------------- |
| 公式 HTML 構造変更 | パース失敗時は exit 2 + Issue。記事は現状維持 |
| レート制限         | 月 1 回 + User-Agent 明示 + 4 URL のみ        |
| JS 必須ページ      | v1 調査後 Playwright オプション               |

## 変更履歴

| 日付       | 内容                     |
| ---------- | ------------------------ |
| 2026-07-29 | v0 スケルトン + 本設計書 |
