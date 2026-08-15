# Issue #229 — Secrets / 手動設定チェックリスト

> 訪問数 0 調査（[#229](https://github.com/felix-jp-studio/blog-affiliate-pipeline/issues/229)）で特定された、**User 手動設定**が必要な項目。  
> Agent は値を発明しません。設定完了後に Issue へコメントしてください。

## 優先度 P1 — 検索流入改善に直結

### GSC API（週次レポート・URL Inspection）

| #   | Secret / Var                   | 設定先                 | 状態      | 手順                                                        |
| --- | ------------------------------ | ---------------------- | --------- | ----------------------------------------------------------- |
| 1   | `GSC_SERVICE_ACCOUNT_JSON`     | GitHub Actions Secrets | ⬜ 未確認 | [gsc-parallel-setup.md](./gsc-parallel-setup.md) トラック A |
| 2   | `GSC_SITE_URL`                 | GitHub Actions Secrets | ⬜ 未確認 | verify-access の Suggested 値を使用                         |
| 3   | `GSC_PLAYWRIGHT_STORAGE_STATE` | GitHub Actions Secrets | ⬜ 未確認 | `npm run gsc:auth:login` → base64 登録                      |

**確認コマンド（ローカル、JSON を export 後）:**

```bash
npm run gsc:verify-access
npm run gsc:verify-ui
```

**Workflow 影響:**

- `.github/workflows/gsc-inspect-daily.yml` — 日次 10 URL 検査
- `.github/workflows/gsc-weekly-report.yml` — 月曜週次レポート（secrets 未設定時 skip）

### IndexNow（Bing / Yandex 通知）

| #   | Env                   | 設定先                                      | 状態      | 手順                          |
| --- | --------------------- | ------------------------------------------- | --------- | ----------------------------- |
| 4   | `INDEXNOW_KEY`        | GitHub Actions Secrets                      | ⬜ 未確認 | [indexnow.md](../indexnow.md) |
| 5   | `INDEXNOW_KEY`        | Vercel Production (`sim-hikari-guide-site`) | ⬜ 未確認 | GitHub と**同じキー**         |
| 6   | Production 再デプロイ | Vercel                                      | ⬜ 未確認 | env 追加後必須                |

**確認コマンド:**

```bash
curl -s "https://sim-hikari-guide.com/{YOUR_KEY}.txt"
INDEXNOW_KEY=your-key npm run test:e2e:indexnow
```

## 優先度 P2 — 計測・PDCA

### GSC ダッシュボード（手動ログイン）

| #   | 作業                                                                               | 成果物                              |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| 7   | [Search Console](https://search.google.com/search-console) 28 日パフォーマンス確認 | Issue #229 コメント                 |
| 8   | GSC パフォーマンス CSV エクスポート                                                | `data/gsc-performance-YYYYMMDD.csv` |
| 9   | [GA4](https://analytics.google.com/) リアルタイム確認                              | Issue #229 コメント                 |

### Vercel Production env

| #   | Env                        | 説明                                     |
| --- | -------------------------- | ---------------------------------------- |
| 10  | `PUBLIC_GA_MEASUREMENT_ID` | `G-DVF88R849B`（本番 HTML に存在確認済） |
| 11  | `INDEXNOW_KEY`             | 上記 IndexNow と同一                     |

## Agent 側（secrets 不要・自動化済み）

| 項目                   | コマンド / ファイル                              |
| ---------------------- | ------------------------------------------------ |
| 週次ログ生成           | `npm run gsc:weekly-log`                         |
| キュー ETA             | `npm run gsc:index-queue-status`                 |
| Visitability metrics   | `npm run visitability:metrics -- --update-state` |
| インデックスキュー正本 | `data/gsc-index-queue.json`                      |
| 日次検査               | `gsc-inspect-daily` workflow（09:00 JST）        |

## 設定完了後の Agent アクション

1. GSC CSV 受領 → `npm run gsc:import-rewrite-queue`
2. `GSC_SERVICE_ACCOUNT_JSON` 設定確認 → 週次レポート workflow 本番配線
3. pending 0 到達 → rewrite-queue PDCA 開始

## 関連ドキュメント

- [secrets.md](../secrets.md) — 全 Secrets 一覧
- [indexnow.md](../indexnow.md) — IndexNow セットアップ
- [gsc-api-weekly-report.md](../gsc-api-weekly-report.md) — 週次 API レポート
- [gsc-parallel-setup.md](./gsc-parallel-setup.md) — GSC API + UI 並行セットアップ
