# Core Web Vitals smoke（Lighthouse CI）

本番 URL に対する週次 Lighthouse smoke です。Hub 1 ページ + 記事 1 ページを計測し、パフォーマンス回帰の早期検知を目的とします。

| 項目         | 値                                                                 |
| ------------ | ------------------------------------------------------------------ |
| workflow     | `.github/workflows/cwv-smoke.yml`                                  |
| 設定         | `lighthouserc.cjs`                                                 |
| スケジュール | 毎週日曜 11:00 JST + `workflow_dispatch`                           |
| 対象 URL     | `/sim`（Hub）、`/articles/sim-osusume-hikaku-2026`（記事サンプル） |

## しきい値（初期）

| 指標              | レベル | 値        |
| ----------------- | ------ | --------- |
| Performance score | warn   | ≥ 0.6     |
| Accessibility     | warn   | ≥ 0.85    |
| Best Practices    | warn   | ≥ 0.85    |
| SEO               | warn   | ≥ 0.9     |
| LCP               | warn   | ≤ 4000 ms |
| CLS               | warn   | ≤ 0.15    |

- アサーションは **`warn`** のみ（LHCI 上は失敗扱いにしない）
- workflow ジョブは **`continue-on-error: true`** — 本番 CDN・計測ブレで flaky になり得るため、初期は merge をブロックしない

## ローカル実行

```bash
npx @lhci/cli@0.14.0 autorun
```

## 今後の tighten 方針

1. 4 週分の週次結果を確認し中央値ベースラインを記録
2. Performance を 0.7 → 0.8 へ段階的に引き上げ
3. 安定後に `continue-on-error` を外し、assert を `error` に変更

## 関連

- `docs/e2e-publish-check-design.md` — P2 Lighthouse CI タスク
- `.github/workflows/post-deploy-smoke.yml` — HTTP/OG smoke（別系統）
