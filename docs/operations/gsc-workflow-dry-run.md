# GSC Workflow ドライラン手順（Issue #229 secrets 設定後）

> **いつ使うか**: [issue-229-secrets-checklist.md](./issue-229-secrets-checklist.md) の GSC 関連 Secrets（`GSC_SERVICE_ACCOUNT_JSON` / `GSC_SITE_URL` / `GSC_PLAYWRIGHT_STORAGE_STATE`）を GitHub Actions に登録した **直後**。本番 cron に任せる前に、ローカル検証 → Actions 手動実行の順で確認する。

Agent は Secret の値を発明しません。値の取得・登録は User が行い、本手順は **確認方法** のみを記載します。

## 前提

| Secret / Var                   | 用途                       | 設定手順                                                    |
| ------------------------------ | -------------------------- | ----------------------------------------------------------- |
| `GSC_SERVICE_ACCOUNT_JSON`     | URL Inspection API         | [gsc-parallel-setup.md](./gsc-parallel-setup.md) トラック A |
| `GSC_SITE_URL`                 | プロパティ URL             | verify-access の `Suggested GSC_SITE_URL` を使用            |
| `GSC_PLAYWRIGHT_STORAGE_STATE` | GSC UI（インデックス登録） | `npm run gsc:auth:login` → base64 登録（トラック C）        |

OAuth 代替（SA の代わり）: `GSC_OAUTH_CLIENT_ID` / `GSC_OAUTH_CLIENT_SECRET` / `GSC_OAUTH_REFRESH_TOKEN` — 詳細は [secrets.md](../secrets.md)。

---

## Phase 1 — ローカル検証（Secrets export 後）

GitHub に登録した **同じ値** をローカル shell に export してから実行します（`.env.local` に置いても可。コミットしない）。

```bash
cd blog-affiliate-pipeline
npm ci
npx playwright install chrome   # gsc:verify-ui 用（初回のみ）

# User が設定した値を export（例 — 実際の値は User が入力）
# export GSC_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
# export GSC_SITE_URL='sc-domain:sim-hikari-guide.com'   # または URL プレフィックス形式
# export GSC_PLAYWRIGHT_STORAGE_STATE='...'               # base64 文字列
```

### 1-1. API アクセス — `gsc:verify-access`

```bash
npm run gsc:verify-access
```

| 結果       | 出力例 / 終了コード                                         | 意味・次のアクション                                                   |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| **成功**   | `OK — siteUrl=... verdict=PASS`（または `NEUTRAL`）、exit 0 | API + URL Inspection が動作。`GSC_SITE_URL` が正しい                   |
| **失敗**   | `FAILED — ...`、exit 2                                      | [gsc-parallel-setup.md](./gsc-parallel-setup.md) トラック A/B を再確認 |
| **失敗**   | `GSC API credentials missing`、exit 1                       | `GSC_SERVICE_ACCOUNT_JSON`（または OAuth 三点セット）が未 export       |
| **要対応** | Accessible properties が `(none)`                           | GSC「ユーザーと権限」に SA の `client_email` を **完全** 権限で追加    |
| **要対応** | `Suggested GSC_SITE_URL` が表示                             | GitHub Secret `GSC_SITE_URL` を提案値に更新してから再実行              |

補足: `verdict=NEUTRAL` は公開直後などで正常。403 が出ないことが重要。

### 1-2. UI セッション — `gsc:verify-ui`

```bash
npm run gsc:verify-ui
```

| 結果     | 出力例 / 終了コード                        | 意味・次のアクション                                                        |
| -------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| **成功** | `OK — URL Inspection loaded (...)`、exit 0 | Playwright セッション有効。Secret 登録 OK                                   |
| **失敗** | `FAILED — auth_required` 等、exit 2        | `npm run gsc:auth:login` → verify-ui が OK になるまで Secret を更新しない   |
| **失敗** | `Playwright storage missing`、exit 1       | `GSC_PLAYWRIGHT_STORAGE_STATE` 未 export、または auth:login 未実施          |
| **失敗** | `URL Inspection panel text not found`      | ログイン後に GSC の URL 検査画面まで進んでから Chrome を閉じて再 auth:login |

**Phase 1 完了条件**: 両コマンドが exit 0。ここまで OK なら Phase 2 へ。

---

## Phase 2 — GitHub Actions 手動実行（ドライラン）

リポジトリ: `felix-jp-studio/blog-affiliate-pipeline`  
UI: **Actions** タブ → 対象 Workflow → **Run workflow** → Branch `main`

### 2-1. GSC inspect daily（日次検査）

| 項目     | 値                                                                                 |
| -------- | ---------------------------------------------------------------------------------- |
| Workflow | **GSC inspect daily** (`.github/workflows/gsc-inspect-daily.yml`)                  |
| 推奨入力 | `limit`: `3`（UI クォータ節約）、`api_only`: `false`（UI も検証）                  |
| 代替起動 | `.github/trigger-gsc-inspect` にタイムスタンプ行を追加 → main push（limit=3 固定） |

**確認ポイント**（Run ページ → **Summary**）:

| セクション                | 成功の目安                               | 失敗・要対応の目安                                  |
| ------------------------- | ---------------------------------------- | --------------------------------------------------- |
| Preflight (verify-access) | `OK — siteUrl=... verdict=...`           | `FAILED` / 403 / credentials missing                |
| UI preflight (verify-ui)  | `OK — URL Inspection loaded`             | `auth_required` / storage missing / panel not found |
| Log（inspect-batch 末尾） | バッチ実行ログ、URL ごとの UI / API 結果 | 例外で step 失敗                                    |
| Index queue status        | pending / indexed 件数が表示             | （always 実行 — 失敗時も参考になる）                |

**Run 全体の成功 / 失敗**:

| 状態           | Job 結果  | 追加シグナル                                                                   |
| -------------- | --------- | ------------------------------------------------------------------------------ |
| **成功**       | green     | main に `chore(gsc): daily inspect batch` commit（キュー更新時）               |
| **部分成功**   | green     | UI が `already_indexed` / `requested`、API に verdict あり（ops レポート参照） |
| **失敗**       | red       | Artifact `gsc-inspect-report` / `gsc-inspect-screenshots` を確認               |
| **UI skipped** | green/red | ops レポートの UI 列が `skipped` → トラック C 再実行                           |

成果物: `docs/operations/gsc-inspect-run-YYYY-MM-DD.md`（commit または artifact）

詳細: [gsc-inspect-production.md](./gsc-inspect-production.md)

### 2-2. GSC weekly report（週次レポート）

| 項目         | 値                                                                |
| ------------ | ----------------------------------------------------------------- |
| Workflow     | **GSC weekly report** (`.github/workflows/gsc-weekly-report.yml`) |
| 初回確認     | `fixture`: `true`（API 不要・サンプル行のみ）                     |
| Secrets 確認 | `fixture`: `false`（`GSC_SERVICE_ACCOUNT_JSON` 登録後）           |

**Summary の読み方**:

| 状態                     | Summary 表示                                      | 意味                                        |
| ------------------------ | ------------------------------------------------- | ------------------------------------------- |
| **fixture 成功**         | サンプル行付きログ、Job green                     | Workflow 配線 OK（本番 API は未使用）       |
| **Secrets あり（現行）** | `Credential mode: service-account` + dry-run ログ | SA 検出 OK。スクリプトは `--dry-run` で実行 |
| **Secrets 未設定**       | `Secrets missing — graceful skip (exit 0)`        | 意図的スキップ。Secret 登録後に再 Run       |
| **Job 失敗**             | red                                               | ログ末尾の stderr を確認                    |

ローカル同等コマンド:

```bash
npm run gsc:weekly-report -- --fixture    # サンプルのみ
npm run gsc:weekly-report -- --dry-run    # credentials 有無で skip / 接続確認
```

詳細: [gsc-api-weekly-report.md](../gsc-api-weekly-report.md)

---

## Phase 3 — ドライラン完了後

1. Issue [#229](https://github.com/felix-jp-studio/blog-affiliate-pipeline/issues/229) にコメント（verify-access / verify-ui の結果、Actions Run URL、ops レポート日付）
2. 日次 cron（09:00 JST）と週次 cron（月曜 09:00 JST）を監視 — 初回 1〜2 回は Actions 履歴を確認
3. Agent 向け後続（[issue-229-secrets-checklist.md](./issue-229-secrets-checklist.md) 参照）:
   - GSC CSV 受領 → `npm run gsc:import-rewrite-queue`
   - 週次レポート API 本番配線（必要時）
   - pending 0 到達 → rewrite-queue PDCA

---

## クイック参照 — 成功 / 失敗シグナル一覧

| レイヤ           | 成功                           | 失敗（代表）                                        |
| ---------------- | ------------------------------ | --------------------------------------------------- |
| verify-access    | `OK — siteUrl=... verdict=...` | `FAILED — 403` / `(none)` properties                |
| verify-ui        | `OK — URL Inspection loaded`   | `auth_required` / `storage missing`                 |
| inspect-daily WF | green + preflight OK           | red / UI `skipped` / artifact にスクショ            |
| weekly-report WF | green + credential mode 表示   | red / `Secrets missing`（未設定時は skip で green） |

---

## 関連ドキュメント

- [issue-229-secrets-checklist.md](./issue-229-secrets-checklist.md) — Secrets 登録チェックリスト（本手順の入口）
- [gsc-parallel-setup.md](./gsc-parallel-setup.md) — API 403 + UI skipped の並行セットアップ
- [gsc-inspect-production.md](./gsc-inspect-production.md) — 日次本番運用・監視
- [gsc-inspect-automation.md](../gsc-inspect-automation.md) — 日次バッチアーキテクチャ
- [gsc-api-weekly-report.md](../gsc-api-weekly-report.md) — 週次 API レポート
- [secrets.md](../secrets.md) — 全 Secrets 一覧
