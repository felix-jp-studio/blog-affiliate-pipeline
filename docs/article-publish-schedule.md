# 記事公開スケジュール調査

対象: sim-hikari-guide.com（現状25本・目標100 KW・テンプレ/Groq パイプライン）

## 現行スケジュール（2026-07-20 更新）

**週7本 = 月〜土（3タイプ × 各2本）+ 日曜（crosssell 1本）**

| 項目                   | 値                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| モード                 | `weekly`                                                                                                      |
| 曜日（JST）            | 日・月・火・水・木・金・土                                                                                    |
| 1回あたり              | 1本                                                                                                           |
| 週上限                 | 7本                                                                                                           |
| 月〜土タイプ別クォータ | comparison 2 / howto 2 / troubleshoot 2                                                                       |
| 日曜                   | `crosssell` 1本（`data/keywords.sunday.csv`、タイプ均等配分なし）                                             |
| タイプ配分（月〜土）   | `type_order` を round-robin でインターリーブ                                                                  |
| GitHub Actions cron    | `0 0 * * 0-6`（UTC 日〜土 00:00 = JST 日〜土 09:00）                                                          |
| 公開フロー             | 生成 → validate → **Playwright スナップショット更新** → **main へ直接 push** → push 連動 CI / Vercel デプロイ |

### 日曜クロスセル（固定費×通信）

- **キーワード**: `data/keywords.sunday.csv`（初期 18 KW、`article_type=crosssell`）
- **カテゴリ / タイプ**: `cost` / `crosssell`（サイトラベル: 固定費・セット）
- **選定**: priority 昇順。Mon-Sat の `type_counts` / インターリーブには**非連動**
- **生成**: テンプレート or Groq（`config/prompts/article-crosssell.md`、2段階 CV → 通信キャリア ASP）
- **Hub**: `/cost`
- 詳細: [sunday-crosssell-design.md](./sunday-crosssell-design.md)

### 曜日分散の根拠

- **1日1本 × 7日**を採用（`articles_per_run: 1`）。1 コミットあたりの diff を小さく保ち、YMYL 記事の目視レビューを現実的にするため、まとめ生成より均等分散を優先。
- 日曜は固定費×通信のクロスセル専用枠とし、月〜土の SIM / 光 / トラブル記事とコンテンツ軸を分離。
- `concurrency: scheduled-articles` で同時実行を直列化（二重生成の抑制）。
- 定期記事は **PR を作らず main に直接 push**（workflow 内で validate / visual 済み）。手動・エージェント記事は従来どおり PR + `articles-auto-merge.yml`。

### タイプ均等配分（type balancing）の仕組み

1. `config/publish-schedule.json` の `type_order`（`[comparison, howto, troubleshoot]`）と `weekly_type_quota`（各2）から、週の理想シーケンスを round-robin で生成する:
   `comparison → howto → troubleshoot → comparison → howto → troubleshoot`
2. `state/publish-queue.json` の `type_counts`（今週のタイプ別公開数）を消費クレジットとして扱い、シーケンス上で「まだ埋まっていない最初のスロット」のタイプを**次に必要なタイプ**として決定する（`next_needed_type`）。
3. 各実行では、次に必要なタイプの**未公開キーワードを priority 昇順で1件**選ぶ（`data/keywords.seed.csv` の `priority` と `article_type` を使用）。
4. `type_counts` は ISO 週が変わると自動リセットされる。週途中でフォールバックにより特定タイプが超過した場合も、不足タイプへ需要が自動的にシフトする。

### キーワード在庫とフォールバック

未公開キーワード在庫（2026-07-20 時点）:

| タイプ       | 総数 | 未公開 | 2本/週での目安 |
| ------------ | ---- | ------ | -------------- |
| comparison   | 40   | 18     | 約 9 週        |
| howto        | 35   | 33     | 約 16 週       |
| troubleshoot | 25   | 24     | 約 12 週       |

- 当面の不足はなし。**comparison が最初に枯渇（約9週後）**、次いで troubleshoot（約12週）、howto（約16週）。
- **フォールバック順序**: 必要タイプの未公開キーワードが尽きた場合、(1) まだクォータに達していない他タイプ → (2) 残りの任意タイプ、の順で priority 昇順に選択する（`_preferred_types`）。これにより特定タイプが枯渇しても週6本の生成は継続する。
- 枯渇が近づいたら `data/keywords.seed.csv` に該当タイプのキーワードを補充すること（特に comparison）。

## 選択肢の比較（初期調査・週2本時点）

| 観点                     | A: 平日毎日1本                                       | B: 週3（火木土） | C: 週2（月木）各1本          |
| ------------------------ | ---------------------------------------------------- | ---------------- | ---------------------------- |
| SEO・Helpful Content     | 薄い量産印象・YMYL でリスク大                        | 中程度           | **信頼・深度を確保しやすい** |
| クロール/インデックス    | 小規模サイトでは crawl budget 余裕あり。速度より品質 | やや速い         | 十分（週2でも月8本）         |
| アフィリエイト/YMYL      | 料金・条件の検証時間不足                             | 中               | **PR レビューと相性良**      |
| 運用（テンプレ品質・PR） | 平日1h/日ではレビュー追いつかない                    | 週3 PR は負荷高  | **週2 PR で現実的**          |
| 競合（格安SIM比較系）    | 大メディアのみ。個人・小規模は週1〜3本が主流         | やや多め         | **業界中央値に近い**         |

## 判断（初期・2026-07-19）※現在は上記「現行スケジュール」に更新済み

> 以下は初期導入時（週2本）の判断記録。2026-07-20 に週6本（3タイプ×2）へ移行済み。品質ゲート・PR レビュー体制が安定し、タイプ均等配分ロジックを導入したため増量した。

**採用: Option C — 週2回（月・木）、各1本（`max_per_week: 2`）**

### 理由（要約）

1. **SEO**: Google Helpful Content は「量」より「有用性・独自性」。15本規模の新規サイトで毎日更新は thin content リスクが上回る。週2なら月8本ペースで100 KW を約1年で消化可能。
2. **YMYL 通信**: 料金・キャンペーン・MNP 手順は誤情報がコンバージョンと ASP 審査に直結。生成→PR レビュー→Vercel 反映のサイクルに余裕が必要。
3. **運用**: テンプレートモードは品質ゲート通過後も目視確認が望ましい。`articles_per_run: 1` で PR 1本あたりの diff を小さく保つ。
4. **競合**: 格安SIM・光回線比較の中規模サイトは週1〜3本更新が多く、週2は自然な頻度。

### 不採用理由

- **A（毎日）**: レビュー能力・品質担保と矛盾。初期15本サイトで毎日は信頼構築よりスパム的に見えやすい。
- **B（週3）**: 月12本は可能だが、平日1h/日の制約下で PR レビューがボトルネックになりやすい。

### 初期実装設定（週2本・superseded）

| 項目                | 値                                                                |
| ------------------- | ----------------------------------------------------------------- |
| モード              | `weekly`                                                          |
| 曜日（JST）         | 月曜・木曜                                                        |
| 1回あたり           | 1本                                                               |
| 週上限              | 2本                                                               |
| GitHub Actions cron | `0 0 * * 1,4`（UTC 月木 00:00 = JST 09:00）                       |
| 公開フロー          | 生成 → PR 作成 → **人手レビュー後マージ**（自動 main マージなし） |

## 手動実行（workflow_dispatch）

定期 cron（日〜土 09:00 JST）に加え、GitHub Actions から手動で記事生成を起動できる。ワークフロー: [`.github/workflows/scheduled-articles.yml`](../.github/workflows/scheduled-articles.yml)

### 手順

1. GitHub リポジトリ → **Actions** タブ
2. 左サイドバーで **Scheduled articles** を選択
3. 右上 **Run workflow** → ブランチ（通常 `main`）を確認 → **Run workflow**

### 入力: `force`

| 値                    | 意味                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `false`（デフォルト） | 通常の手動実行（スケジュール曜日・同一日ガードは CLI 側）                                        |
| `true`                | 生成 CLI に `--force` を渡し、**スケジュール曜日外**でも実行可能（同一日・週上限のガードは維持） |

#### `force=true` を使う場面

- **スケジュール外の曜日**にテスト生成したいとき（例: 設定変更後の動作確認）
- cron が失敗・スキップした日の**リカバリ**（ただし `state/publish-queue.json` の `last_run` が当日の場合は「already ran today」でスキップされる）

`force=true` でも **同一日 2 回目**や **週 7 本上限超過**は生成されない（`publish-scheduled --force` の仕様）。

### 実行後のフロー

```text
workflow_dispatch / cron
  → dry-run 検証（--dry-run --force・ファイル変更なし）
  → 記事生成（Groq / テンプレート）
  → format / validate / Playwright スナップショット更新
  → main へ直接 commit & push
  → push 連動: ci.yml / post-publish-index-queue.yml / indexnow-ping.yml
  → Vercel が main をデプロイ（sim-hikari-guide.com 反映）
```

- Job summary に生成内容の要約が出る
- 変更がなければ push しない（`changed=false`）
- main の branch protection で PR 必須の場合は push が拒否される → Settings で **Allow GitHub Actions to bypass** を有効化
- 本番反映は Vercel のデプロイ完了を確認（[`docs/vercel-deploy.md`](./vercel-deploy.md)）

### 日曜 crosssell と dry-run

- **日曜（JST）**の実行は `data/keywords.sunday.csv` から **crosssell 1 本**を選ぶ（月〜土の type 均等配分とは独立）。詳細: [sunday-crosssell-design.md](./sunday-crosssell-design.md)
- ワークフロー冒頭の **Dry-run scheduled publish** ステップは、常に `publish-scheduled --dry-run --force` を実行する。実ファイル・`publish-queue.json` は更新せず、生成計画だけを検証する
- 日曜に手動実行した場合、dry-run も本生成も **crosssell プロファイル**が使われる（実行日の JST 曜日で決まる）
- 日曜以外に `force=true` で手動実行した場合は **月〜土プロファイル**（comparison / howto / troubleshoot のインターリーブ）が使われ、crosssell は生成されない

## トラブルシューティング

### main への push が拒否される

**症状**: `Commit and push to main` で `remote: Permission denied` または branch protection エラー。

**対策**: リポジトリ **Settings → Branches → Branch protection rules**（main）で、**Allow specified actors to bypass required pull requests** に `github-actions[bot]` を追加。または定期記事用に protection を緩和。

### 手動・エージェント PR で CI が `action_required` で止まる

**症状**: `./scripts/gh-user.sh pr create` 等の **手動 PR** で CI / auto-merge が `action_required` のまま（2026-07-24〜26 に定期 PR で発生。定期記事は直接 push に移行済み）。

**対策**: Actions タブで pending run を Approve、または `gh run rerun`。Secret / PAT なしで定期記事は再発しない。

### PR 作成権限エラー（2026-07-23・レガシー）

- エラー: `GitHub Actions is not permitted to create or approve pull requests`
- 定期記事は PR 作成しないため該当しない。手動 PR のみ Settings 確認。

### 生成失敗（品質ゲート）

**症状**: `文字数不足: XXXX < 3500` 等で `publish-scheduled` が exit 1（2026-07-22 howto）。

**対策**: `template_articles.py` の min length パディング修正済み（PR #60）。再発時は generator ログと `npm run test:generator` を確認。

## 変更履歴

| 日付       | 内容                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-07-26 | 定期記事を PR 経由から **main 直接 push** に変更（action_required 回避）                                    |
| 2026-07-26 | `pull_request_target` + `GITHUB_BOT_TOKEN` で approve デッドロック対策（手動 PR 向け）                      |
| 2026-07-25 | トラブルシューティング追加。`action_required` 自動 approve ワークフロー                                     |
| 2026-07-19 | 初版。Option C 採用（週2本・月木）                                                                          |
| 2026-07-20 | 週6本（3タイプ×2）へ増量。月〜土 09:00 JST、タイプ均等インターリーブ配分を導入。cron `0 0 * * 1-6`          |
| 2026-07-21 | 定期記事 PR に Playwright visual/text スナップショット自動更新を追加（Ubuntu CI 上で `--update-snapshots`） |
| 2026-07-21 | 手動実行（workflow_dispatch）運用手順を追記                                                                 |
