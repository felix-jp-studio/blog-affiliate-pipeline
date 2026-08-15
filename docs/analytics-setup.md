# GA4 / Search Console セットアップ

## 環境変数（Vercel）

| 変数                         | 説明                                         | 例                             |
| ---------------------------- | -------------------------------------------- | ------------------------------ |
| `PUBLIC_GA_MEASUREMENT_ID`   | GA4 測定 ID                                  | `G-XXXXXXXXXX`                 |
| `PUBLIC_GSC_VERIFICATION`    | GSC 所有権確認用 meta 内容                   | `abc123...`                    |
| `PUBLIC_CONTACT_FORM_ACTION` | お問い合わせフォーム POST 先（Formspree 等） | `https://formspree.io/f/xxxxx` |
| `PUBLIC_CONTACT_EMAIL`       | フォーム未設定時の mailto 表示用             | `contact@example.com`          |

Vercel → `sim-hikari-guide-site` → Settings → Environment Variables で **`PUBLIC_GA_MEASUREMENT_ID` は Production のみ** に設定する（Preview / Development には設定しない）。

## GA4 初回セットアップ

1. https://analytics.google.com/ でプロパティ作成
2. データストリーム → ウェブ → URL: `https://sim-hikari-guide.com`
3. 測定 ID（`G-...`）を `PUBLIC_GA_MEASUREMENT_ID` に設定
4. 再デプロイ後、リアルタイムレポートでアクセス確認

---

## 開発者・内部トラフィックの除外（推奨構成）

本番サイト（`sim-hikari-guide.com`）へのアクセス計測は維持しつつ、開発者・社内・プレビュー環境のヒットを **アクティブユーザー / レポートから除外** するための二段構えです。

| レイヤー        | 手段                                          | 対象                                             |
| --------------- | --------------------------------------------- | ------------------------------------------------ |
| 1. 環境変数     | `PUBLIC_GA_MEASUREMENT_ID` を Production のみ | Vercel Preview（`*.vercel.app`）                 |
| 2. コード       | `traffic_type: 'internal'` を gtag に送信     | localhost / `*.vercel.app` / オプトアウト Cookie |
| 3. GA4 管理画面 | 内部トラフィック定義 + データフィルター       | 自宅・モバイル等 IP が変わる開発者               |
| 4. GA4 管理画面 | Developer traffic フィルター（Active）        | GTM プレビュー・Tag Assistant 等                 |

**推奨:** IP 固定（オフィス）→ GA4 の「内部トラフィック定義」。IP 可変（在宅・カフェ）→ コードの `?ga_internal=1` または GA4 Developer traffic フィルター。**両方有効化** するのが最も安全です。

### コード側の挙動（`site/src/components/Analytics.astro`）

測定 ID が設定されている場合のみ GA を読み込み、次の条件で **`traffic_type: 'internal'`** を `gtag('config', ...)` に付与します。

| 条件     | 例                                                                  |
| -------- | ------------------------------------------------------------------- |
| ホスト名 | `localhost` / `127.0.0.1` / `*.vercel.app`                          |
| クエリ   | `https://sim-hikari-guide.com/?ga_internal=1`（Cookie を 1 年保存） |
| Cookie   | `ga_internal=1` が存在                                              |

本番確認時に自分を除外したい場合: ブラウザで一度 `https://sim-hikari-guide.com/?ga_internal=1` を開く。解除するには Cookie `ga_internal` を削除。

> **注意:** `traffic_type` を付与しても GA4 側でデータフィルターを **Active** にしない限り、レポートには残ります（Testing モードでは除外されません）。

### Vercel Preview と GA4

- **現状の推奨:** `PUBLIC_GA_MEASUREMENT_ID` を Preview に設定しない → Preview デプロイの HTML に GA タグ自体が出力されない。
- **防御的実装:** 万が一 Preview にも測定 ID がある場合、`*.vercel.app` では `traffic_type: 'internal'` を送る（上記コード）。

---

## GA4 管理画面での設定手順（手動・ログイン必須）

以下は **プロパティ管理者** が https://analytics.google.com/ で行います。AI / エージェントはログインできないため、ユーザー自身の操作が必要です。

### 前提

- 対象プロパティ: `sim-hikari-guide.com` 用 GA4 プロパティ
- 測定 ID: `G-DVF88R849B`（本番 HTML で使用中）
- 左下 **Admin（管理）** から設定

### A. 内部トラフィックの定義（IP アドレス）

固定 IP（オフィス・VPN 出口など）がある場合:

1. **Admin** → **Data collection and modification（データの収集と修正）** → **Data streams（データ ストリーム）**
2. ウェブストリーム（`https://sim-hikari-guide.com`）をクリック
3. 下部 **Google tag（Google タグ）** → **Configure tag settings（タグの設定を構成）**
4. **Show all / Show more（すべて表示）** → **Define internal traffic（内部トラフィックを定義）**
5. **Create（作成）**
   - **Rule name:** 例 `Office / VPN`
   - **traffic_type value:** `internal`（デフォルトのまま）
   - **Match type:** `IP address equals` または `IP address is in range (CIDR)`
   - **Value:** 自宅・オフィスの **グローバル IP**（https://ifconfig.me 等で確認）
6. **Create** で保存

在宅など IP が変わる場合は、IP ルールに加えてコード側の `?ga_internal=1` を併用してください。

### B. 内部トラフィックのデータフィルター（除外の有効化）

1. **Admin** → **Data collection and modification** → **Data filters（データ フィルター）**
2. 一覧の **Internal Traffic（内部トラフィック）** を開く（無ければ **Create filter** → 種類 **Internal traffic**）
3. **Parameter value（パラメータ値）:** `internal`
4. **Filter operation:** **Exclude（除外）**
5. **Filter state（フィルターの状態）:**
   - まず **Testing** → レポートで `Test data filter name` ディメンションに値が付くか確認
   - 問題なければ **Active** → **Save** → 確認ダイアログで **Activate filter**

> **重要:** Testing のままでは **レポート上の数値は変わりません**。必ず Active にしてください。

### C. 開発者トラフィック（debug_mode）の除外

GTM プレビュー・Google Tag Assistant 等で `debug_mode=1` のイベントを除外:

1. **Admin** → **Data filters**
2. **Developer traffic（開発者トラフィック）** を開く
3. **Filter operation:** **Exclude**
4. **Filter state:** **Testing** で確認後 **Active** → **Save** → **Activate filter**

本サイトは gtag 直書きのため、通常閲覧では `debug_mode` は付きません。Tag Assistant 利用時のみ該当します。

### D. 除外の動作確認

| 確認方法           | 手順                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| リアルタイム       | **Reports → Realtime** で、除外対象のアクセスが「通常ユーザー」として増えないか                                         |
| Testing フィルター | フィルターが Testing の間、探索レポート等でディメンション **Test data filter name** = `Internal Traffic` でヒットを確認 |
| DebugView          | **Admin → DebugView**（debug_mode 付きセッションのみ。内部除外の主確認手段ではない）                                    |

フィルターは **有効化以降のデータのみ** に適用され、過去データは遡及修正されません。

---

## Search Console 手順

1. https://search.google.com/search-console でプロパティ追加
2. **ドメイン** または **URL プレフィックス**（`https://sim-hikari-guide.com`）を選択
3. 所有権確認:
   - **HTML タグ** を選び、content 値を `PUBLIC_GSC_VERIFICATION` に設定 → 再デプロイ
   - または Cloud DNS に TXT レコードを追加（ドメイン確認の場合）
4. サイトマップ送信: `https://sim-hikari-guide.com/sitemap-index.xml`（Astro ビルド後に生成）

## お問い合わせフォーム（Formspree 例）

1. https://formspree.io/ で無料アカウント作成
2. 新規フォーム → エンドポイント URL を `PUBLIC_CONTACT_FORM_ACTION` に設定
3. 再デプロイ後、`/contact` からテスト送信
