# CWV smoke 週次ベースライン（モバイル）

本番 3 URL に対する Lighthouse CI（**mobile**）の中央値を週次で記録する。  
計測設定の正本: [`docs/cwv-smoke.md`](../cwv-smoke.md) / `lighthouserc.cjs`。

| 項目         | 値                                                                           |
| ------------ | ---------------------------------------------------------------------------- |
| フォーム因子 | mobile（`formFactor: "mobile"`）                                             |
| 対象 URL     | `/` · `/sim` · `/articles/sim-osusume-hikaku-2026`                           |
| assert 方針  | **warn のみ**（`continue-on-error: true`）。error 化は 4 週安定後に検討      |
| 記録単位     | LHCI がアップロードする **median LHR**（`numberOfRuns: 3` の中央値。PR #128） |

## 記録手順

1. 日曜スケジュールまたは `workflow_dispatch` で `.github/workflows/cwv-smoke.yml` を実行
2. Job Summary / LHCI temporary storage の median レポートから指標を転記
3. 下表に 1 行追加（古い週は残す。tighten 判断用）

## 週次中央値ログ

| 週（JST）  | 実行元        | URL                                 | Perf | A11y | BP   | SEO  | LCP (ms) | CLS   | TBT (ms) | 備考                                                     |
| ---------- | ------------- | ----------------------------------- | ---- | ---- | ---- | ---- | -------- | ----- | -------- | -------------------------------------------------------- |
| 2026-08-01 | local autorun | `/`                                 | 0.55 | 1.00 | 1.00 | 1.00 | 14004    | 0.000 | 0        | 初回シード。ラボ LCP は回線/スロットルで過大になりやすい |
| 2026-08-01 | local autorun | `/sim`                              | 0.55 | 1.00 | 1.00 | 1.00 | 22008    | 0.000 | 0        | 同上                                                     |
| 2026-08-01 | local autorun | `/articles/sim-osusume-hikaku-2026` | 0.55 | 0.96 | 1.00 | 1.00 | 21323    | 0.000 | 0        | 同上                                                     |

> **運用メモ**: 週次の正は GitHub Actions 上の smoke。ローカル単発はシード・デバッグ用。4 週分の GHA 中央値が揃ったら Performance しきい値の引き上げ（0.7 → 0.8）を検討（`docs/cwv-smoke.md`）。

## しきい値（現行・warn）

| 指標              | 値        |
| ----------------- | --------- |
| Performance score | ≥ 0.6     |
| Accessibility     | ≥ 0.85    |
| Best Practices    | ≥ 0.85    |
| SEO               | ≥ 0.9     |
| LCP               | ≤ 4000 ms |
| CLS               | ≤ 0.15    |
| TBT               | ≤ 600 ms  |

## 関連

- `docs/cwv-smoke.md` — smoke 方針・tighten ロードマップ
- `.github/workflows/cwv-smoke.yml` — 週次 / 手動実行
- `lighthouserc.cjs` — URL・assert 定義
