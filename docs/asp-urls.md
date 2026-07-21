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

テンプレート記事は `{AFFILIATE:linemo}` プレースホルダを使い、生成時に `asp-urls.json` から URL を解決します。

```bash
npm run generate:template
npm run test:generator
```

### 4. 既存記事 Markdown の URL

`site/src/content/articles/*.md` には **ハードコードされたトラッキング URL** が残っています。  
新規・更新時は `asp-urls.json` を更新したうえで、該当記事のリンクも合わせて更新してください。

将来的には `{AFFILIATE:carrier-id}` プレースホルダへの移行を推奨します。

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

| プログラム ID   | キャリア     | ASP  | 状態        | 備考                                                         |
| --------------- | ------------ | ---- | ----------- | ------------------------------------------------------------ |
| rakuten-mobile  | 楽天モバイル | A8   | active      | —                                                            |
| linemo          | LINEMO       | VC   | active      | —                                                            |
| au-hikari       | auひかり     | A8   | active      | —                                                            |
| softbank-hikari | SB光         | A8   | active      | —                                                            |
| wimax           | WiMAX        | A8   | active      | —                                                            |
| ahamo           | ahamo        | 公式 | pending     | fallbackUrl のみ                                             |
| povo            | povo         | 公式 | pending     | fallbackUrl のみ                                             |
| uq-mobile       | UQ mobile    | 公式 | pending     | fallbackUrl のみ                                             |
| **nuro-hikari** | **NURO 光**  | A8   | **pending** | **A8 提携申請中。承認後 `trackingUrl` / `programId` を設定** |

### pending プログラムの挙動

- `status: pending` かつ `trackingUrl` 未設定の場合、生成・サイトビルドは `fallbackUrl`（公式サイト）へ解決する
- `{AFFILIATE:nuro-hikari}` プレースホルダも同様に公式 URL へフォールバック（ビルドは失敗しない）
- **A8 提携承認後**: User が [pub.a8.net](https://pub.a8.net/) でトラッキング URL を取得 → `status` を `active`、`programId` / `trackingUrl` を設定 → 該当記事を `{AFFILIATE:nuro-hikari}` へ反映

## 関連ドキュメント

- [`docs/pipeline-flow.md`](./pipeline-flow.md) — パイプライン全体
- [`docs/e2e-publish-check-design.md`](./e2e-publish-check-design.md) — アフィリエイトリンク検証
