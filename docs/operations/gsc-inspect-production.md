# GSC 日次検査バッチ — 本番運用

> **ステータス**: 本番運用中（2026-08-09 〜）

## スケジュール

| 項目       | 値                                               |
| ---------- | ------------------------------------------------ |
| Workflow   | `.github/workflows/gsc-inspect-daily.yml`        |
| 実行時刻   | **毎日 09:00 JST**（UTC 00:00 cron）             |
| 1 回あたり | **10 URL**（`--week-first` で古い pending 優先） |
| モード     | UI + API + キュー commit/push                    |

手動実行: GitHub Actions → **GSC inspect daily** → Run workflow

手動 retrigger（`.github/trigger-gsc-inspect` push）は **limit=3**（UI クォータ節約）。本番日次は cron のみ limit=10。

## 監視

| 確認項目     | 場所                                            |
| ------------ | ----------------------------------------------- |
| 実行履歴     | Actions → GSC inspect daily                     |
| Job summary  | 各 Run の Summary（preflight + ログ）           |
| 日次レポート | `docs/operations/gsc-inspect-run-YYYY-MM-DD.md` |
| キュー       | `data/gsc-index-queue.json`                     |
| UI 失敗時    | Run artifact `gsc-inspect-screenshots`          |

### 正常時の目安

- **API preflight**: `OK — siteUrl=... verdict=...`
- **UI preflight**: `OK — URL Inspection loaded`
- **push**: `chore(gsc): daily inspect batch` commit が main に反映
- **UI 列**: `requested` / `already_indexed`（`auth_required` / `skipped` が続く場合は下記トラブルシュート）

## Secrets（必須）

| Secret                         | 更新頻度                     |
| ------------------------------ | ---------------------------- |
| `GSC_SERVICE_ACCOUNT_JSON`     | キーローテ時                 |
| `GSC_SITE_URL`                 | プロパティ変更時             |
| `GSC_PLAYWRIGHT_STORAGE_STATE` | セッション失効時（数週間〜） |

セットアップ: [gsc-parallel-setup.md](./gsc-parallel-setup.md)

## トラブルシュート

| 症状                     | 対処                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| API 403                  | `npm run gsc:verify-access` → SA / GSC_SITE_URL 確認                |
| UI auth_required         | `npm run gsc:auth:login` → `gsc:verify-ui` → Secret 更新            |
| push rejected            | 通常は rebase 済み。失敗時は artifact の ops レポートを確認         |
| UI skipped（ボタンなし） | スクリーンショット確認。GSC UI 変更時は `request-index-ui.mjs` 更新 |

## クォータ

- **URL Inspection API**: 2,000 回/日（10 URL/日なら余裕あり）
- **GSC UI インデックス登録リクエスト**: 約 10 件/日（limit=10 に合わせ済み）

## 関連

- [gsc-inspect-automation.md](../gsc-inspect-automation.md)
- 公開後キュー投入: `.github/workflows/post-publish-index-queue.yml`
