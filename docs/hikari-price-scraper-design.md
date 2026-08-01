# 光回線 料金スクレイパー — 設計

## 目的

公式料金ページの変更を検知し、比較記事の **料金表・キャンペーン表記** を鮮度維持する。Month 2 収益ロードマップ「NURO / 光回線 料金改定スクレイパー」。

## スコープ

| 項目                                        | v0  | v1       | 以降     |
| ------------------------------------------- | --- | -------- | -------- |
| HTTP GET + 死活                             | ✅  | ✅       | —        |
| HTML パース（月額・工事費）                 | —   | ✅       | 精度改善 |
| `data/hikari-prices-snapshot.json` 書き込み | —   | ✅       | —        |
| 429 / レート制限の soft-fail                | —   | ✅       | —        |
| 差分 → `rewrite-queue.csv`                  | —   | 別 PR    | —        |
| Playwright（JS 描画ページ）                 | —   | 要否調査 | 任意     |

## 対象プロバイダ（初期）

| key               | URL                                       | 記事 relevance         |
| ----------------- | ----------------------------------------- | ---------------------- |
| `nuro-hikari`     | https://nuro-hikari.com/                  | nuro-hikari-* 比較記事 |
| `au-hikari`       | https://www.au.com/internet/              | au-hikari-*            |
| `softbank-hikari` | https://www.softbank.jp/internet/         | softbank-hikari-*      |
| `docomo-hikari`   | https://www.docomo.ne.jp/internet/hikari/ | docomo-hikari-*        |

## 実行方式

### GitHub Actions

```yaml
# .github/workflows/hikari-price-scraper.yml
schedule:
  - cron: "0 15 1 * *" # 毎月1日 00:00 JST = UTC 前日15:00
workflow_dispatch:
```

1. `packages/scraper` で `pip install -r requirements.txt`
2. `python -m scraper.hikari_prices` → `data/hikari-prices-snapshot.json` + artifact
3. 差分フック（`scripts/price-diff-rewrite-hook.mjs`）→ `rewrite-queue.csv`

### ローカル

```bash
cd packages/scraper
python -m scraper.hikari_prices --dry-run
python -m scraper.hikari_prices --fixture-dir tests/fixtures --dry-run
```

## データモデル（v1）

```json
{
  "version": "1",
  "updatedAt": "2026-08-01T00:00:00Z",
  "source": "live",
  "providers": {
    "nuro-hikari": {
      "url": "https://nuro-hikari.com/",
      "ok": true,
      "monthlyFeeYen": 5200,
      "constructionFeeYen": 0,
      "campaignNote": "...",
      "parseStatus": "parsed",
      "rateLimited": false,
      "rewriteSlugs": ["nuro-hikari-au-hikari-hikaku", "nuro-hikari-campaign"]
    }
  },
  "summary": {
    "total": 4,
    "ok": 3,
    "rateLimited": ["nuro-hikari"],
    "fetchFailed": []
  }
}
```

## レート制限

- NURO 等で **HTTP 429** を観測済み。最大 3 リトライ + `Retry-After` / 指数バックオフ。
- 429 のみの失敗は **exit 0**（soft-fail）。ハード失敗は exit 2。
- ライブ不安定時は `--fixture-dir tests/fixtures` でパース検証。

## 連携

- **rewrite-queue**: 料金差分検知 → `data/rewrite-queue.csv`（price-diff-rewrite-hook）
- **generator**: 比較表テンプレに snapshot 値を注入（将来）

## リスク

| リスク             | 緩和                                                |
| ------------------ | --------------------------------------------------- |
| 公式 HTML 構造変更 | `parseStatus` 記録。記事は現状維持。フィクスチャ CI |
| レート制限         | 月 1 回 + UA 明示 + 4 URL + リトライ + soft-fail    |
| JS 必須ページ      | 要否調査後 Playwright オプション                    |

## 変更履歴

| 日付       | 内容                              |
| ---------- | --------------------------------- |
| 2026-07-29 | v0 スケルトン + 本設計書          |
| 2026-08-01 | v1 パース・snapshot・月次 Actions |
