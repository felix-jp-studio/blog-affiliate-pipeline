# Affiliate Phase 3 — 手動 Intake 運用ガイド

> **対象読者**: `felix-jp-studio` アカウントで GitHub / ASP 管理画面を操作する担当者  
> **Agent の制約**: A8・バリューコマース・もしもへの **自動ログイン不可**。tracking URL は **管理画面からコピーしたもののみ** 使用可（推測・生成禁止）

**関連ファイル**

| ファイル                                                                                                     | 役割                            |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| [`config/asp-urls.json`](../../config/asp-urls.json)                                                         | プログラム・tracking URL の正本 |
| [`.github/ISSUE_TEMPLATE/affiliate-url-intake.yml`](../../.github/ISSUE_TEMPLATE/affiliate-url-intake.yml)   | URL 受け取り Issue テンプレート |
| [`.github/workflows/affiliate-sync-agent-cycle.yml`](../../.github/workflows/affiliate-sync-agent-cycle.yml) | 同期計画 + Agent Issue 自動作成 |
| [`docs/asp-urls.md`](../asp-urls.md)                                                                         | レジストリ設計・Phase 3 概要    |

---

## 現在のレジストリ一覧（2026-08-02 時点）

### ASP プロバイダ（`providers`）

| キー            | 表示名               | 状態        | 管理画面                         |
| --------------- | -------------------- | ----------- | -------------------------------- |
| `a8`            | A8.net               | **active**  | https://pub.a8.net/              |
| `valuecommerce` | バリューコマース     | **active**  | https://aff.valuecommerce.ne.jp/ |
| `moshimo`       | もしもアフィリエイト | **pending** | https://af.moshimo.com/af/s/     |
| `official`      | 公式サイト（非 ASP） | active      | —                                |

### プログラム（`programs`）

| programKey        | ラベル         | ASP              | 状態        | 備考                                                                 |
| ----------------- | -------------- | ---------------- | ----------- | -------------------------------------------------------------------- |
| `rakuten-mobile`  | 楽天モバイル   | A8               | **active**  | trackingUrl 設定済                                                   |
| `linemo`          | LINEMO         | バリューコマース | **active**  | `pid=892660854`, `sid=3776193`                                       |
| `ahamo`           | ahamo          | A8               | **active**  | テキストリンク「ahamo」。21 記事 `{AFFILIATE:ahamo}` 済              |
| `ahamo-hikari`    | ahamo光        | A8               | **active**  | テキストリンク「【ahamo光】」。12 記事 `{AFFILIATE:ahamo-hikari}` 済 |
| `au-hikari`       | auひかり       | A8               | **active**  | —                                                                    |
| `softbank-hikari` | ソフトバンク光 | A8               | **active**  | —                                                                    |
| `wimax`           | WiMAX          | A8               | **active**  | —                                                                    |
| `nuro-hikari`     | NURO 光        | A8               | **active**  | テキストリンク「NURO光」。11 記事 `{AFFILIATE:nuro-hikari}` 済       |
| **`uq-mobile`**   | **UQ mobile**  | A8               | **pending** | **A8 提携申請中**（povo 代替）。承認後 intake 必須                   |
| `povo`            | povo           | 公式             | **pending** | A8 に案件なし。`fallbackUrl`: https://povo.jp/                       |

**Phase 3 で人間が動く主な対象**: `uq-mobile`（承認待ち）、将来の URL 更新、`lastVerified` 期限切れの再取得。

---

## 前提条件（Prerequisites）

### 1. GitHub アカウント・リポジトリ

| 項目           | 値                                                             |
| -------------- | -------------------------------------------------------------- |
| リポジトリ     | https://github.com/felix-jp-studio/blog-affiliate-pipeline     |
| 推奨アカウント | `felix-jp-studio`（Issue 作成・ラベル付与・workflow 手動実行） |
| 必要な権限     | Issues 作成、Actions の workflow 手動実行、PR レビュー         |

### 2. GitHub ラベル（事前確認）

リポジトリ **Issues → Labels** で次が存在することを確認:

| ラベル                | 用途                                    |
| --------------------- | --------------------------------------- |
| `affiliate-sync`      | URL intake Issue テンプレートに自動付与 |
| `affiliate-sync-auto` | Agent 同期サイクル workflow のトリガー  |

ラベルが無い場合: **Issues → Labels → New label** で作成（色は任意）。

### 3. ASP アカウント（手動ログイン用）

| ASP              | 登録 URL                         | 管理画面                         | 本ガイドで使う案件                                 |
| ---------------- | -------------------------------- | -------------------------------- | -------------------------------------------------- |
| A8.net           | https://www.a8.net/              | https://pub.a8.net/              | `uq-mobile`（承認後）、既存 active 案件の URL 更新 |
| バリューコマース | https://www.valuecommerce.ne.jp/ | https://aff.valuecommerce.ne.jp/ | `linemo`（参考・更新時）                           |

> **セキュリティ**: ログイン ID / パスワードは **このドキュメント・Issue・PR に書かない**。Agent に認証情報を渡さない。

### 4. ローカル環境（Scenario E 用・任意）

```bash
cd /path/to/blog-affiliate-pipeline   # クローン済みリポジトリ
node -v   # 22 推奨（CI と同じ）
npm ci
```

---

## Scenario A: UQ mobile — A8 管理画面から tracking URL を取得

**目的**: `uq-mobile` の A8 提携承認後、`config/asp-urls.json` に intake するための URL を取得する。

**現状**: `status: pending`、`fallbackUrl`: https://www.uqwimax.jp/mobile/（公式）。承認前は intake しない。

### A-1. 提携承認の確認

1. ブラウザで https://pub.a8.net/ を開く
2. 右上 **ログイン** をクリック → A8 パブリッシャー ID / パスワードを入力（**手動**）
3. ログイン後、左メニューまたはトップから **プログラム管理**（または **広告取得**）を開く
4. 検索ボックスに `UQ` または `UQ mobile` と入力
5. 案件一覧で **UQ mobile**（または UQ モバイル関連案件）のステータスが **提携中** / **広告取得可** になっていることを確認
   - **申請中** / **審査中** の場合 → この Scenario は **中断**。承認メールまたは管理画面更新を待つ

### A-2. テキストリンク（tracking URL）の取得 — クリック手順

A8 管理画面のメニュー名は UI 改修で多少変わる場合があります。見つからない場合は **リンクコード** / **テキストリンク** / **広告リンク** 等の近い名称を探してください。

1. **pub.a8.net** ログイン済み状態で、左ナビ **広告取得** → **プログラム検索**（または **プログラム管理**）をクリック
2. 検索欄に `UQ mobile` を入力 → **検索** をクリック
3. 該当プログラム行の **詳細** / **広告取得** をクリック
4. **リンクコード取得**（または **リンク作成**）タブを開く
5. リンク種別で **テキストリンク** を選択（バナーではなくテキスト推奨 — 記事 CTA と相性が良い）
6. 表示された HTML スニペット例:
   ```html
   <a href="https://px.a8.net/svt/ejp?a8mat=XXXXXXXX+XXXX+XXXX+XXXXXXX" rel="nofollow"
     >...</a
   >
   ```
7. **`href` 内の URL 全体**（`https://px.a8.net/svt/ejp?a8mat=...`）をコピー
   - HTML ごとコピーしても可（後段の `affiliate:parse` が解析）
8. 同画面に **a8mat** / プログラム ID が表示されていればメモ（任意 — URL からも抽出可）

**検証ポイント**

- ホストが **`px.a8.net`** であること（`www.uqwimax.jp` 直リンクは intake 不可）
- URL を **推測で組み立てていない** こと（管理画面の **生成結果をそのまま** コピー）

### A-3. 取得後の次アクション

- **Scenario D**（Issue テンプレート）または **Scenario E**（ローカル intake）へ進む
- programKey は必ず **`uq-mobile`**

---

## Scenario B: バリューコマース — LINEMO 案件（参考・URL 更新時）

**目的**: バリューコマース側の tracking URL 再取得手順。`linemo` は既に **active** だが、URL 変更・再発行時に同じ手順を使う。

**登録済み値（参考）**

| 項目        | 値                                                                              |
| ----------- | ------------------------------------------------------------------------------- |
| programKey  | `linemo`                                                                        |
| programId   | `892660854`                                                                     |
| siteId      | `3776193`（`providers.valuecommerce.siteId`）                                   |
| trackingUrl | `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854` |

### B-1. 管理画面ログイン

1. https://aff.valuecommerce.ne.jp/ を開く
2. **ログイン** → バリューコマース アフィリエイト ID / パスワード（**手動**）

### B-2. LINEMO プロモーションリンクの取得

1. ログイン後、トップまたは左メニュー **プロモーション** / **広告** / **リンク取得** を開く
2. 検索または一覧から **LINEMO** を探す（プログラム ID `892660854` が表示される場合あり）
3. **リンク取得** / **テキストリンク作成** をクリック
4. 生成された URL をコピー。形式例:
   ```
   https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854
   ```
5. ホストに **`valuecommerce.com`** が含まれることを確認

### B-3. intake 時の programKey

- Issue テンプレート: **Program key** = `linemo`、**ASP provider** = `valuecommerce`
- ローカル dry-run（JSON stdin 必須）:

```bash
cat <<'EOF' | npm run affiliate:intake:dry-run -- linemo
{
  "programId": "892660854",
  "trackingUrl": "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854",
  "provider": "valuecommerce",
  "status": "active"
}
EOF
```

---

## Scenario C: Affiliate sync agent cycle workflow（GitHub UI 操作）

**目的**: pending プログラム・ヘルスアラートから同期計画を作成し、Agent 用 Issue を自動生成する。

**Workflow ファイル**: `.github/workflows/affiliate-sync-agent-cycle.yml`  
**Workflow 名（Actions 一覧）**: **Affiliate sync agent cycle**

### トリガー方法（3 通り）

| 方法                    | 条件                                             |
| ----------------------- | ------------------------------------------------ |
| **手動実行**            | Actions → Run workflow                           |
| **Issue ラベル**        | 既存 Issue に `affiliate-sync-auto` ラベルを付与 |
| **repository_dispatch** | 外部連携（通常は不要）                           |

### C-1. 手動実行（推奨・最も確実）

1. ブラウザで https://github.com/felix-jp-studio/blog-affiliate-pipeline/actions/workflows/affiliate-sync-agent-cycle.yml を開く
2. 青い **Run workflow** ボタン（右側）をクリック
3. ドロップダウン **Branch**: **`main`** を選択
4. 緑色 **Run workflow** をクリック
5. ページ上部 **Affiliate sync agent cycle** の実行一覧に新しい Run が表示される → クリック
6. Job **agent-cycle** が完了するまで待つ（通常 2〜5 分）
7. 成功時: リポジトリ **Issues** タブに新規 Issue が作成される
   - タイトル例: `Affiliate Sync Cycle N: uq-mobile, ...`
   - ラベル: **`affiliate-sync-auto`**
8. Issue 本文の **ユーザーチェックリスト** を読み、Scenario A / B で URL 取得 → Issue **コメント** に ASP ペーストを貼る
9. コメント例:
   ```
   programKey: uq-mobile
   provider: a8

   <a href="https://px.a8.net/svt/ejp?a8mat=...">UQ mobile</a>
   ```
10. Agent（Cursor）に Issue URL を渡し、intake PR 作成を依頼

### C-2. Issue ラベルでトリガー

1. https://github.com/felix-jp-studio/blog-affiliate-pipeline/issues を開く
2. 任意の Issue を開く（または新規作成）
3. 右サイドバー **Labels** → **`affiliate-sync-auto`** を選択
4. 数秒〜1 分後、Actions に workflow Run が開始される → C-1 の 5〜10 と同様

### C-3. workflow が skip になった場合

Job ログの **Health check and plan** ステップを確認:

- `action=skip` → pending プログラムもヘルスアラートも無い（**正常**、Issue は作成されない）
- `action=plan` → Agent Issue 作成ステップが実行される

---

## Scenario D: Issue テンプレート — フィールド入力ガイド

**作成 URL**: https://github.com/felix-jp-studio/blog-affiliate-pipeline/issues/new?template=affiliate-url-intake.yml

テンプレート名: **Affiliate URL intake**

### フィールド一覧（上から順）

| #   | フィールド名（UI）                 | 入力内容                                                                                     | 必須 |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------- | ---- |
| 1   | （説明 Markdown）                  | 読むだけ。A8 / VC 管理画面 URL の案内                                                        | —    |
| 2   | **Program key**                    | ドロップダウンから選択。UQ 承認後は **`uq-mobile`**                                          | ✓    |
| 3   | **ASP provider**                   | `a8` または `valuecommerce`                                                                  | ✓    |
| 4   | **Manual steps completed**         | 両方チェック: 「ASP 管理画面にログインした」「リンク生成画面から tracking URL をコピーした」 | ✓    |
| 5   | **ASP paste (HTML or plain text)** | Scenario A/B でコピーした HTML または URL を **そのまま** 貼り付け                           | ✓    |
| 6   | **Program ID (optional)**          | URL から自動抽出できない場合のみ（例: `4B8097+XXXXXXXX+XXXX+XXXXXXX`）                       | —    |
| 7   | **Registry status**                | 承認済み URL なら **`active`**（デフォルト）。未承認なら `pending` のまま intake しない      | ✓    |
| 8   | **Notes (optional)**               | 例: `A8 提携承認 2026-08-16。UQ 関連記事 CTA 更新予定`                                       | —    |

### 入力例（UQ mobile・承認後）

| フィールド             | 値                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Program key            | `uq-mobile`                                                                            |
| ASP provider           | `a8`                                                                                   |
| Manual steps completed | 両方 ✓                                                                                 |
| ASP paste              | `<a href="https://px.a8.net/svt/ejp?a8mat=4B8097+XXXXXXXX+XXXX+XXXXXXX">UQ mobile</a>` |
| Program ID             | （空欄可 — parse が URL から抽出）                                                     |
| Registry status        | `active`                                                                               |
| Notes                  | `A8 提携承認。fallback から ASP URL へ切替`                                            |

### Issue 作成後

1. 自動付与ラベル **`affiliate-sync`** を確認
2. Agent に Issue 番号を伝え、`affiliate:parse` → intake PR を依頼
3. PR マージ後 Scenario F で本番確認

---

## Scenario E: ローカル npm コマンド（コピペ用）

リポジトリルートで実行。プレースホルダ `XXXXXXXX` は **管理画面からコピーした実 URL** に置き換えること。

### E-1. ASP ペーストの解析

```bash
# A8 HTML スニペット（active 案件の例: ahamo）
npm run affiliate:parse -- --text '<a href="https://px.a8.net/svt/ejp?a8mat=4BB6H3+LGDU+4TIO+5YJRM">ahamo</a>'

# plain URL（linemo / バリューコマース）
npm run affiliate:parse -- --text 'https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854'

# JSON 出力
npm run affiliate:parse -- --text 'https://px.a8.net/svt/ejp?a8mat=4B8097+2XZ6GI+424K+NTJWY' --json
```

### E-2. dry-run intake（ファイル書き込みなし）

**UQ mobile（承認後の想定）**

```bash
cat <<'EOF' | npm run affiliate:intake:dry-run -- uq-mobile
{
  "programId": "4B8097+XXXXXXXX+XXXX+XXXXXXX",
  "trackingUrl": "https://px.a8.net/svt/ejp?a8mat=4B8097+XXXXXXXX+XXXX+XXXXXXX",
  "provider": "a8",
  "status": "active",
  "note": "A8 提携承認。UQ 関連記事 {AFFILIATE:uq-mobile} 解決用"
}
EOF
```

**既存 active 案件の更新例（ahamo）**

```bash
cat <<'EOF' | npm run affiliate:intake:dry-run -- ahamo
{
  "programId": "4BB6H3+LGDU+4TIO+5YJRM",
  "trackingUrl": "https://px.a8.net/svt/ejp?a8mat=4BB6H3+LGDU+4TIO+5YJRM",
  "provider": "a8",
  "status": "active"
}
EOF
```

**LINEMO（バリューコマース）**

```bash
cat <<'EOF' | npm run affiliate:intake:dry-run -- linemo
{
  "programId": "892660854",
  "trackingUrl": "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3776193&pid=892660854",
  "provider": "valuecommerce",
  "status": "active"
}
EOF
```

### E-3. 本番 intake（`config/asp-urls.json` を更新）

dry-run でエラーが無いことを確認してから:

```bash
cat <<'EOF' | npm run affiliate:intake -- uq-mobile
{
  "programId": "4B8097+XXXXXXXX+XXXX+XXXXXXX",
  "trackingUrl": "https://px.a8.net/svt/ejp?a8mat=4B8097+XXXXXXXX+XXXX+XXXXXXX",
  "provider": "a8",
  "status": "active"
}
EOF
```

### E-4. 同期計画（Agent サイクル前の確認）

```bash
npm run affiliate:health
npm run affiliate:plan:dry-run
npm run affiliate:plan   # data/affiliate-sync-brief.json を生成
```

### E-5. テスト

```bash
npm run test:affiliate
npm run affiliate:health:dry-run
```

### E-6. PR 作成

intake 後:

```bash
git checkout -b feature/affiliate-intake-uq-mobile
git add config/asp-urls.json
git commit -m "chore(affiliate): intake uq-mobile tracking URL from A8"
git push -u origin HEAD
./scripts/gh-user.sh pr create --title "chore(affiliate): intake uq-mobile" --label "cursor-agent"
```

---

## Scenario F: マージ後の本番確認（sim-hikari-guide.com）

Vercel が `main` マージ後にデプロイ完了するまで **2〜5 分** 待つ。

### F-1. active 案件のリンク確認（curl）

```bash
# ahamo 比較記事 — px.a8.net が HTML に含まれること
curl -sL 'https://sim-hikari-guide.com/articles/ahamo-povo-hikaku' | grep -o 'https://px.a8.net[^"'"'"'<> ]*' | head -3

# NURO 光
curl -sL 'https://sim-hikari-guide.com/articles/nuro-hikari-campaign' | grep -o 'https://px.a8.net[^"'"'"'<> ]*' | head -3

# LINEMO / バリューコマース（該当記事に VC リンクがある場合）
curl -sL 'https://sim-hikari-guide.com/articles/linemo-ahamo-hikaku' | grep -o 'https://[^"'"'"'<> ]*valuecommerce.com[^"'"'"'<> ]*' | head -3
```

**UQ mobile 承認後 — レジストリ確認（記事プレースホルダ移行前）**

> **注意（2026-08-16 時点）**: リポジトリ内の記事 Markdown に `{AFFILIATE:uq-mobile}` は **まだ存在しません**。intake 直後は **レジストリとヘルスチェック** で確認し、記事へのプレースホルダ反映は別 PR（`docs/asp-urls.md` 参照）で行います。`sim-senior-osusume` 等の比較記事に出る `px.a8.net` は **ahamo / rakuten-mobile** 由来であり、UQ intake の成功判定には使えません。

```bash
# マージ後: uq-mobile が active + trackingUrl 設定済みか
node -e "const r=require('./config/asp-urls.json'); console.log(r.programs['uq-mobile'])"

# ヘルスレポートで uq-mobile の到達性
npm run affiliate:health
grep -A5 '"programKey": "uq-mobile"' data/affiliate-health-report.json || true
```

**記事に `{AFFILIATE:uq-mobile}` を反映した後**（別 PR マージ後）:

```bash
# UQ 比較記事（プレースホルダ反映後に px.a8.net が UQ CTA に付く）
curl -sL 'https://sim-hikari-guide.com/articles/ymobile-uq-mobile-hikaku' | grep -o 'https://px.a8.net[^"'"'"'<> ]*' | head -3
# または UQ 専記記事（例: uq-mobile-kaiyaku-tejun）— プレースホルダ追加後
```

**pending 中（intake 前）**: 上記記事の UQ CTA は `fallbackUrl`（`uqwimax.jp`）のまま — **`px.a8.net` が出ないのが正常**

### F-2. ブラウザ確認

1. https://sim-hikari-guide.com/articles/ahamo-povo-hikaku を開く
2. 記事中の CTA リンクを **右クリック → リンクのアドレスをコピー**
3. ホストが **`px.a8.net`**（A8）または **`valuecommerce.com`**（VC）であること
4. リンク先が公式トップ直リンクのみの場合 → intake 未反映または `status: pending` を疑う

### F-3. ヘルスチェック（ローカル）

```bash
npm run affiliate:health
cat data/affiliate-health-report.json | head -40
```

---

## Scenario G: GA4 内部トラフィックフィルター（未設定の場合）

本番確認で自分のアクセスを GA4 レポートから除外する。**Google アカウントでの手動ログイン必須**。

詳細: [`docs/analytics-setup.md`](../analytics-setup.md) の「GA4 管理画面での設定手順」

### クイック手順

1. https://analytics.google.com/ を開く → **`sim-hikari-guide.com` 用プロパティ**（測定 ID `G-DVF88R849B`）を選択
2. 左下 **Admin（管理）**
3. **A. 内部トラフィック定義**（固定 IP がある場合）
   - **Data streams** → ウェブストリーム → **Configure tag settings** → **Define internal traffic**
   - Rule name: `Office / VPN`、`traffic_type`: `internal`、自宅/オフィスのグローバル IP（https://ifconfig.me で確認）
4. **B. データフィルター有効化**
   - **Data filters** → **Internal Traffic** → **Exclude** → まず **Testing** → 問題なければ **Active**
5. **C. Developer traffic** も **Exclude** + **Active**（Tag Assistant 利用時）
6. IP が可変（在宅）の場合: 一度 https://sim-hikari-guide.com/?ga_internal=1 を開き Cookie 除外を併用

> **注意**: フィルターが **Testing** のままではレポート数値は変わりません。**Active** 必須。

---

## トラブルシューティング

| 症状                                    | 想定原因                                     | 対処                                                                         |
| --------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| `affiliate:intake` がホストエラー       | `px.a8.net` / `valuecommerce.com` 以外の URL | 管理画面から正しい tracking URL を再コピー。公式 URL は intake 不可          |
| UQ が A8 で見つからない                 | 提携未承認                                   | Scenario A-1 でステータス確認。承認まで intake しない                        |
| workflow が `skip`                      | pending / アラートなし                       | 正常。手動で Issue テンプレート（Scenario D）を使う                          |
| Agent Issue が作成されない              | plan が skip / workflow 失敗                 | Actions ログ確認 → `npm run affiliate:plan` をローカル実行                   |
| 本番が `uqwimax.jp` のまま              | `uq-mobile` が pending                       | intake + マージ + デプロイ完了を確認                                         |
| `affiliate:parse` が URL 0 件           | ペースト形式が不正                           | HTML ごと、または `https://px.a8.net/...` を plain で再貼付                  |
| PR の CI validate 失敗                  | asp-urls スキーマ / 記事検証                 | ログの `validate-articles` を確認。`npm run test:affiliate` をローカル再現   |
| GA4 に自分のアクセスが残る              | フィルター Testing のまま                    | Scenario G — **Active** に変更                                               |
| `3 consecutive affiliate sync failures` | 連続失敗で pause                             | `config/affiliate-sync-state.json` の `paused` を確認。手動で Issue + intake |

---

## 今すぐやること（チェックリスト 1〜10）

Phase 3 の **次の一手** を上から順に実行してください。

1. **A8 管理画面**（https://pub.a8.net/）にログインし、**UQ mobile** 案件の提携ステータスが **承認済み** か確認する（未承認なら承認通知を待つ）
2. 承認済みなら **リンクコード取得 → テキストリンク** から `https://px.a8.net/svt/ejp?a8mat=...` をコピーする（推測禁止）
3. GitHub で **Affiliate URL intake** Issue を作成する（https://github.com/felix-jp-studio/blog-affiliate-pipeline/issues/new?template=affiliate-url-intake.yml）— **Program key: `uq-mobile`**、**ASP provider: `a8`**、ペーストを貼る
4. Issue に **`affiliate-sync`** ラベルが付いていることを確認し、Agent に Issue URL を渡して intake PR 作成を依頼する
5. （任意）Actions で **Affiliate sync agent cycle** workflow を **Run workflow**（branch: `main`）し、自動 Agent Issue が出るか確認する
6. PR マージ前に `cat <<'EOF' | npm run affiliate:intake:dry-run -- uq-mobile`（JSON 付き）と `npm run test:affiliate` が通ることを Agent / CI で確認する
7. PR を **main** にマージし、Vercel デプロイ完了を待つ（2〜5 分）
8. `node -e "const r=require('./config/asp-urls.json'); console.log(r.programs['uq-mobile'])"` で **`status: active`** と **`trackingUrl`**（`px.a8.net`）を確認する（記事プレースホルダ `{AFFILIATE:uq-mobile}` 反映前は本番 HTML に UQ の A8 リンクは出ない）
9. `npm run affiliate:health`（または週次 workflow）で `uq-mobile` が **active**・到達性 OK であることを確認する
10. GA4 の **内部トラフィックフィルター** が未 **Active** なら [`docs/analytics-setup.md`](../analytics-setup.md) に従い設定する（本番確認のノイズ削減）

---

## 変更履歴

| 日付       | 内容                                    |
| ---------- | --------------------------------------- |
| 2026-08-16 | 初版 — Phase 3 human-in-the-loop 手順書 |
