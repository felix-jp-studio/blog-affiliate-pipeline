# Core Web Vitals smoke（Lighthouse CI）

本番 URL に対する週次 Lighthouse smoke です。**モバイル**でホーム・Hub・記事 3 ページを計測し、パフォーマンス回帰の早期検知を目的とします。

| 項目         | 値                                                                                |
| ------------ | --------------------------------------------------------------------------------- |
| workflow     | `.github/workflows/cwv-smoke.yml`                                                 |
| 設定         | `lighthouserc.cjs`                                                                |
| スケジュール | 毎週日曜 11:00 JST + `workflow_dispatch`                                          |
| フォーム因子 | **mobile**（`formFactor: "mobile"` + `screenEmulation.mobile`）                   |
| 対象 URL     | `/`（ホーム）、`/sim`（Hub）、`/articles/sim-osusume-hikaku-2026`（記事サンプル） |
| 実行回数     | `numberOfRuns: 3`（LHCI median。PR #128）                                     |

## しきい値（初期）

| 指標              | レベル | 値        |
| ----------------- | ------ | --------- |
| Performance score | warn   | ≥ 0.6     |
| Accessibility     | warn   | ≥ 0.85    |
| Best Practices    | warn   | ≥ 0.85    |
| SEO               | warn   | ≥ 0.9     |
| LCP               | warn   | ≤ 4000 ms |
| CLS               | warn   | ≤ 0.15    |
| TBT               | warn   | ≤ 600 ms  |

- ナビ計測（LHCI autorun）では **INP は計測不可**のため assert 対象外。ラボ代理指標として **TBT** を監視
- アサーションは **`warn`** のみ（LHCI 上は失敗扱いにしない）
- workflow ジョブは **`continue-on-error: true`** — 本番 CDN・計測ブレで flaky になり得るため、初期は merge をブロックしない
- 週次中央値の記録先: [`docs/operations/cwv-baseline.md`](./operations/cwv-baseline.md)

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
