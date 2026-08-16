# ASP URL レジストリ

アフィリエイトサービスプロバイダ（ASP）の **管理画面 URL** と **トラッキング URL** をリポジトリで一元管理するための設定です。

## ファイル構成

| ファイル                                                        | 役割                                                |
| --------------------------------------------------------------- | --------------------------------------------------- |
| [`config/asp-urls.json`](../config/asp-urls.json)               | ASP プロバイダ・プログラム・トラッキング URL の正本 |
| [`config/affiliate-rules.json`](../config/affiliate-rules.json) | 記事種別ごとの必須キャリアと `program` 参照         |
| `packages/generator/generator/asp_urls.py`                      | 生成パイプライン用ローダー                          |
| `packages/publisher/src/aspUrls.ts`                             | WordPress 投稿パイプライン用ローダー                |
| `site/src/utils/asp-urls.ts`                                    | サイトビルド用（ホストパターン検出）                |

## `config/asp-urls.json` の構造

### `providers` — ASP 単位のメタデータ

各 ASP（A8、バリューコマース、もしも 等）について以下を保持します。

| フィールド             | 説明                                            |
| ---------------------- | ----------------------------------------------- |
| `displayName`          | 表示名                                          |
| `status`               | `active` / `pending`                            |
| `lastVerified`         | 最終確認日（任意、ISO 8601 日付）               |
| `portal.registration`  | 新規登録 URL                                    |
| `portal.management`    | 管理画面 URL                                    |
| `tracking.hostPattern` | トラッキングリンクのホスト（E2E・サイト検出用） |
| `tracking.urlTemplate` | URL テンプレート（`{programId}` 等。参考用）    |
| `siteId`               | バリューコマース等のサイト ID（公開情報）       |

**コミットしてよいもの**: 公開トラッキング URL、プログラム ID、管理画面 URL  
**コミットしてはいけないもの**: ログイン ID/パスワード、API キー、非公開トークン

### `programs` — キャリア/商材単位

| フィールド     | 説明                                                       |
| -------------- | ---------------------------------------------------------- |
| `label`        | キャリア名                                                 |
| `category`     | `sim` / `hikari`                                           |
| `provider`     | `providers` のキー（`a8`, `valuecommerce`, `official` 等） |
| `programId`    | ASP 側プログラム ID（公開）                                |
| `trackingUrl`  | 実際に記事へ挿入するトラッキング URL                       |
| `fallbackUrl`  | ASP 未契約時の公式 URL（`status: pending`）                |
| `status`       | `active` / `pending`                                       |
| `lastVerified` | 最終確認日（任意）                                         |

## 更新手順

### 0. Intake スクリプト（Phase 1 MVP — 推奨）

ユーザーが A8 / バリューコマース管理画面から取得した `trackingUrl` と `programId` を JSON で渡し、`config/asp-urls.json` を更新します。**Agent は URL を推測しません**（ホストパターン検証のみ）。

```bash
# 例: UQ mobile 承認後
cat <<'EOF' | npm run affiliate:intake:dry-run -- uq-mobile
{
  "programId": "4B8097+XXXXXXXX+XXXX+XXXXXXX",
  "trackingUrl": "https://px.a8.net/svt/ejp?a8mat=4B8097+XXXXXXXX+XXXX+XXXXXXX",
  "provider": "a8",
  "status": "active"
}
EOF

# 問題なければ本番更新
cat <<'EOF' | npm run affiliate:intake -- uq-mobile
{ ... }
EOF
```

| フィールド         | 必須             | 説明                                                  |
| ------------------ | ---------------- | ----------------------------------------------------- |
| `programKey`       | CLI 引数 or JSON | `programs` のキー（例: `uq-mobile`）                  |
| `programId`        | 推奨             | ASP 側プログラム ID（省略時は URL から抽出）          |
| `trackingUrl`      | 必須             | 管理画面からコピーしたトラッキング URL                |
| `provider`         | 任意             | `a8` / `valuecommerce`（省略時は URL ホストから推定） |
| `label` / `status` | 任意             | 表示名・`active` / `pending`                          |

- 検証: `px.a8.net` / `valuecommerce.com` ホストのみ許可
- JSON スキーマ: [`config/affiliate-intake.schema.json`](../config/affiliate-intake.schema.json)（`validateIntakeEntry` で検証）
- 更新後: PR 作成 → レビュー → マージ（registry 変更は PR 必須）
- 詳細設計: [`docs/affiliate-auto-sync-design.html`](./affiliate-auto-sync-design.html)

### 0b. ASP ペースト解析（Phase 3）

A8 / バリューコマース管理画面からコピーした HTML または plain text から tracking URL を抽出します。**ログイン不要**（ユーザーが貼り付けた内容のみ解析）。

```bash
# HTML スニペット or URL を解析
npm run affiliate:parse -- --text '<a href="https://px.a8.net/svt/ejp?a8mat=...">...</a>'
npm run affiliate:parse -- --file paste.html --json

# 解析結果に programKey を付けて intake
npm run affiliate:intake:dry-run -- uq-mobile  # JSON stdin
```

Issue テンプレート [`.github/ISSUE_TEMPLATE/affiliate-url-intake.yml`](../.github/ISSUE_TEMPLATE/affiliate-url-intake.yml) で programKey / provider / ペーストを structured intake できます。

### 0c. Agent 同期サイクル（Phase 3）

pending プログラム・stale `lastVerified`・ヘルスレポート alerts から次の同期対象を計画し、Agent Issue を作成します。

```bash
# 同期計画（data/affiliate-sync-brief.json を生成）
npm run affiliate:plan:dry-run
npm run affiliate:plan

# Agent Issue 作成（GH_TOKEN 必要）
node scripts/affiliate/create-affiliate-agent-issue.mjs
```

| ファイル                                           | 役割                                      |
| -------------------------------------------------- | ----------------------------------------- |
| `config/affiliate-sync-state.json`                 | サイクル番号・lastOutcome                 |
| `data/affiliate-sync-brief.json`                   | 計画結果（対象 program / チェックリスト） |
| `.github/workflows/affiliate-sync-agent-cycle.yml` | plan + Issue 自動作成                     |

**Human-in-the-loop**: Agent は ASP にログインできません。ユーザーが Issue テンプレートまたは Agent Issue チェックリストに tracking URL を貼り付けてから Agent が intake PR を作成します。

**手順書（クリック単位）**: [`docs/operations/affiliate-manual-intake-guide.md`](./operations/affiliate-manual-intake-guide.md) — A8 / バリューコマース intake、GitHub workflow、Issue テンプレート、npm コマンド、本番確認、GA4 除外、トラブルシュート、今すぐやること 1〜10。

### 1. 新規 ASP プログラムを追加（審査通過後）

1. `config/asp-urls.json` の `programs` にエントリを追加
2. `trackingUrl` と `programId` を ASP 管理画面からコピー
3. `status` を `active`、`lastVerified` を更新
4. 必要なら `providers` の `status` も `active` に更新

### 2. キャリアとプログラムの紐付け

`config/affiliate-rules.json` の `carriers` で `program` キーを参照します。

```json
"rakuten-mobile": {
  "label": "楽天モバイル",
  "program": "rakuten-mobile"
}
```

### 3. 生成パイプラインでの利用

テンプレート記事は `{AFFILIATE:linemo}` プレースホルダを使います。**Phase 1 以降、Generator は URL を焼き込まず**プレースホルダのまま Markdown を保存します。サイトビルド時（`remarkAffiliatePlaceholders`）に `asp-urls.json` から URL を解決します。

```bash
npm run generate:template
npm run test:generator
```

`inject_affiliate_urls=True` を指定した場合のみ、従来どおり生成時に URL へ置換します（テスト・レガシー用途）。

### 4. 既存記事 Markdown の URL

`site/src/content/articles/*.md` には **ハードコードされたトラッキング URL** が残っている記事があります（Phase 2 移行中）。

**推奨**: `{AFFILIATE:program-key}` プレースホルダへ移行する。

```bash
# 全体 dry-run
npm run affiliate:migrate:dry-run

# sim カテゴリのみ移行
npm run affiliate:migrate -- --category sim

# 週次ヘルスチェック（trackingUrl 到達性 + lastVerified アラート）
npm run affiliate:health
```

- 移行スクリプト: `scripts/affiliate/migrate-article-links.mjs`
- ヘルスチェック: `scripts/affiliate/link-health-check.mjs` → `data/affiliate-health-report.json`
- CI 週次: `.github/workflows/affiliate-link-health.yml`
- `validate-articles` はハードコード ASP URL を **警告** として検出

## 読み込み元一覧

| コンポーネント                      | 読み込み方法                                                |
| ----------------------------------- | ----------------------------------------------------------- |
| Generator (`inject_affiliates`)     | `asp_urls.resolve_carrier_url`                              |
| Publisher (`injectAffiliateLinks`)  | `aspUrls.resolveCarrierUrl`                                 |
| Site (`hasAffiliateLinks`)          | `asp-urls.json` の active ホストパターン                    |
| E2E (`affiliatePatternsFromConfig`) | `asp-urls.json` から自動導出（`e2e-smoke.json` の上書き可） |
| Visual regression mask              | `asp-urls.json` の active ホストパターン                    |

## 現在登録されている ASP

| ASP                  | 状態    | 管理画面                                                    | トラッキング        |
| -------------------- | ------- | ----------------------------------------------------------- | ------------------- |
| A8.net               | active  | [pub.a8.net](https://pub.a8.net/)                           | `px.a8.net`         |
| バリューコマース     | active  | [aff.valuecommerce.ne.jp](https://aff.valuecommerce.ne.jp/) | `valuecommerce.com` |
| もしもアフィリエイト | pending | [af.moshimo.com](https://af.moshimo.com/af/s/)              | （未設定）          |

## 登録済みプログラム（`programs`）

| プログラム ID    | キャリア     | ASP  | 状態       | 備考                                                              |
| ---------------- | ------------ | ---- | ---------- | ----------------------------------------------------------------- |
| rakuten-mobile   | 楽天モバイル | A8   | active     | —                                                                 |
| linemo           | LINEMO       | VC   | active     | —                                                                 |
| au-hikari        | auひかり     | A8   | active     | —                                                                 |
| softbank-hikari  | SB光         | A8   | active     | —                                                                 |
| wimax            | WiMAX        | A8   | active     | —                                                                 |
| **ahamo**        | **ahamo**    | A8   | **active** | A8 テキストリンク「ahamo」（2026-08-02 取得、ブランド中立）       |
| **ahamo-hikari** | **ahamo光**  | A8   | **active** | A8 テキストリンク「【ahamo光】」（2026-08-02 取得、ブランド中立） |
| povo             | povo         | 公式 | pending    | A8 に案件なし。公式 URL 維持                                      |
| uq-mobile        | UQ mobile    | A8   | pending    | **A8 提携申請中**（povo 代替、2026-07-22）                        |
| **nuro-hikari**  | **NURO 光**  | A8   | **active** | A8 テキストリンク「NURO光」（2026-08-02 取得、`s00000020586001`） |

### pending プログラムの挙動

- `status: pending` かつ `trackingUrl` 未設定の場合、生成・サイトビルドは `fallbackUrl`（公式サイト）へ解決する
- `{AFFILIATE:nuro-hikari}` / `{AFFILIATE:ahamo}` / `{AFFILIATE:ahamo-hikari}` は `status: active` のため A8 trackingUrl へ解決
- **A8 提携承認後**: User が [pub.a8.net](https://pub.a8.net/) でトラッキング URL を取得 → `status` を `active`、`programId` / `trackingUrl` を設定 → 該当記事の `{AFFILIATE:*}` プレースホルダへ反映

### A8 提携申請中（2026-08-02 時点）

| プログラム | 状態                        | 承認後の作業                                                                      |
| ---------- | --------------------------- | --------------------------------------------------------------------------------- |
| ahamo      | **active**（URL 設定済み）  | 下記 21 記事は `{AFFILIATE:ahamo}` → A8 trackingUrl へ解決                        |
| ahamo光    | **active**（URL 設定済み）  | 下記 12 記事は `{AFFILIATE:ahamo-hikari}` → A8 trackingUrl へ解決                 |
| UQ mobile  | 申請中（povo 代替）         | `uq-mobile` の trackingUrl 設定 → UQ 関連記事の CTA を `{AFFILIATE:uq-mobile}` へ |
| NURO 光    | **active**（URL 設定済み）  | 下記 11 記事は `{AFFILIATE:nuro-hikari}` → A8 trackingUrl へ解決                  |
| povo       | **申請なし**（A8 案件なし） | 公式 URL（`https://povo.jp/`）維持                                                |

### `{AFFILIATE:ahamo}` 反映済み記事（21 本）

`status: active`。ビルド時に A8 trackingUrl（`px.a8.net`、ブランド中立テキスト「ahamo」）へ解決される。`ahamo-hikari`（光）とは別管理。

| #   | 記事ファイル                   | 備考               |
| --- | ------------------------------ | ------------------ |
| 1   | `ahamo-povo-hikaku.md`         | ahamo 専記         |
| 2   | `linemo-ahamo-hikaku.md`       | ahamo 専記         |
| 3   | `sim-osusume-hikaku-2026.md`   | 比較セクション CTA |
| 4   | `sim-carrier-hikaku.md`        | 比較セクション CTA |
| 5   | `sim-kodomo-osusume.md`        | 比較セクション CTA |
| 6   | `sim-senior-osusume.md`        | 比較セクション CTA |
| 7   | `sim-gakusei-osusume.md`       | 比較セクション CTA |
| 8   | `sim-houjin-osusume.md`        | 比較セクション CTA |
| 9   | `sim-20gb-osusume.md`          | 比較セクション CTA |
| 10  | `sim-unlimited-data.md`        | 比較セクション CTA |
| 11  | `sim-kakehoudai-yasui.md`      | 比較セクション CTA |
| 12  | `sim-tuuwa-teigaku-hikaku.md`  | 比較セクション CTA |
| 13  | `sim-tethering-osusume.md`     | 比較セクション CTA |
| 14  | `sim-5g-taiou-hikaku.md`       | 比較セクション CTA |
| 15  | `smartphone-setwari-hikaku.md` | 比較セクション CTA |
| 16  | `family-2-lines-cheap.md`      | 比較セクション CTA |
| 17  | `linemo-hyoban-demerit.md`     | 比較セクション CTA |
| 18  | `mineo-hyoban-demerit.md`      | 比較セクション CTA |
| 19  | `iijmio-hyoban-fee.md`         | 比較セクション CTA |
| 20  | `nihon-tsushin-sim-hyoban.md`  | 比較セクション CTA |
| 21  | `hikari-provider-chigai.md`    | 比較セクション CTA |

### `{AFFILIATE:ahamo-hikari}` 反映済み記事（12 本）

`status: active`。ビルド時に A8 trackingUrl（`px.a8.net`、ブランド中立テキスト「【ahamo光】」）へ解決される。`ahamo`（モバイル）エントリとは別管理。

| #   | 記事ファイル                               | 備考                         |
| --- | ------------------------------------------ | ---------------------------- |
| 1   | `docomo-hikari-hikari-collab-hikaku.md`    | ドコモ系光比較に ahamo光追加 |
| 2   | `hikari-provider-chigai.md`                | プロバイダ比較 CTA           |
| 3   | `hikari-1gbps-yasui.md`                    | 比較セクション CTA           |
| 4   | `hikari-kodate-osusume.md`                 | 比較セクション CTA           |
| 5   | `hikari-mansion-osusume.md`                | 比較セクション CTA           |
| 6   | `hikari-switch-osusume.md`                 | 比較セクション CTA           |
| 7   | `home-router-hikari-hikaku.md`             | 比較セクション CTA           |
| 8   | `mobareco-air-wimax-hikaku.md`             | 比較セクション CTA           |
| 9   | `nuro-hikari-au-hikari-hikaku.md`          | 比較セクション CTA           |
| 10  | `nuro-hikari-campaign.md`                  | 比較セクション CTA           |
| 11  | `softbank-hikari-biglobe-hikari-hikaku.md` | 比較セクション CTA           |
| 12  | `wimax-fee-hikaku-2026.md`                 | 比較セクション CTA           |

### `{AFFILIATE:nuro-hikari}` 反映済み記事（11 本）

`status: active`。ビルド時に A8 trackingUrl（`px.a8.net`）へ解決される。

| #   | 記事ファイル                               | 備考                     |
| --- | ------------------------------------------ | ------------------------ |
| 1   | `nuro-hikari-campaign.md`                  | NURO 専記                |
| 2   | `nuro-hikari-au-hikari-hikaku.md`          | NURO 専記                |
| 3   | `wimax-fee-hikaku-2026.md`                 | 比較表内 NURO セクション |
| 4   | `softbank-hikari-biglobe-hikari-hikaku.md` | 比較表内 NURO セクション |
| 5   | `mobareco-air-wimax-hikaku.md`             | 比較表内 NURO セクション |
| 6   | `home-router-hikari-hikaku.md`             | 比較表内 NURO セクション |
| 7   | `hikari-switch-osusume.md`                 | 比較表内 NURO セクション |
| 8   | `hikari-mansion-osusume.md`                | 比較表内 NURO セクション |
| 9   | `hikari-kodate-osusume.md`                 | 比較表内 NURO セクション |
| 10  | `hikari-1gbps-yasui.md`                    | 比較表内 NURO セクション |
| 11  | `docomo-hikari-hikari-collab-hikaku.md`    | 比較表内 NURO セクション |

## 関連ドキュメント

- [`docs/pipeline-flow.md`](./pipeline-flow.md) — パイプライン全体
- [`docs/e2e-publish-check-design.md`](./e2e-publish-check-design.md) — アフィリエイトリンク検証
