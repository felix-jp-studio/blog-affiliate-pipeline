# Vercel デプロイ（コード・CLI 設定）

ダッシュボードの Root Directory / Framework Preset を使わず、`vercel.json` と CLI で設定する手順。

## 前提

| 項目               | 値                                        |
| ------------------ | ----------------------------------------- |
| リポジトリ         | `felix-jp-studio/blog-affiliate-pipeline` |
| サイト             | `site/`（Astro）                          |
| Vercel プロジェクト | `sim-hikari-guide-site`（Root Directory: `site`） |
| 本番ドメイン       | `sim-hikari-guide.com`                    |
| 設定ファイル       | `site/vercel.json`（リダイレクト等）      |

Vercel プロジェクトの **Root Directory = `site`** のとき、ビルドは Astro プリセットが自動検出する。`site/vercel.json` で www → apex リダイレクト等を定義する。

---

## 1. Vercel CLI の準備

```bash
npm install -g vercel@latest
vercel login
```

---

## 2. プロジェクト紐付け（初回のみ）

リポジトリルートで実行:

```bash
cd /path/to/blog-affiliate-pipeline
vercel link --yes --project sim-hikari-guide-site --scope sim-hikari-guide
```

対話で選択:

| 質問                      | 回答                                               |
| ------------------------- | -------------------------------------------------- |
| Set up and deploy?        | **Y**（または既存プロジェクトなら link のみ）      |
| Which scope?              | 自分の Team / Hobby アカウント                     |
| Link to existing project? | **Y**（既に `sim-hikari-guide-site` がある場合） |
| Project name              | `sim-hikari-guide-site`                          |

`.vercel/project.json` が生成されます（gitignore 済み）。

---

## 3. プレビューデプロイ

```bash
vercel deploy
```

成功すると Preview URL が表示されます。

---

## 4. 本番デプロイ

```bash
vercel deploy --prod
```

または Git 連携済みなら `main` への push で自動デプロイ（`vercel.json` が読み込まれる）。

---

## 5. カスタムドメイン（CLI）

```bash
vercel domains add sim-hikari-guide.com
vercel domains add www.sim-hikari-guide.com
```

DNS レコードを確認:

```bash
vercel domains inspect sim-hikari-guide.com
vercel domains inspect www.sim-hikari-guide.com
```

表示された **A レコード（apex）** と **CNAME（www）** を GCP Cloud DNS に設定します。

---

## 6. GCP Cloud DNS にレコード追加（gcloud）

ゾーン名を確認:

```bash
gcloud dns managed-zones list --filter="dnsName:sim-hikari-guide.com."
```

`vercel domains inspect` で得た値に置き換えて実行:

```bash
# 変数（例: Vercel が表示した値に差し替え）
ZONE="sim-hikari-guide-com"
APEX_IP="76.76.21.21"

# apex
gcloud dns record-sets create sim-hikari-guide.com. \
  --zone="${ZONE}" \
  --type=A \
  --ttl=300 \
  --rrdatas="${APEX_IP}"

# www（Vercel 推奨: A レコード。inspect の指示に従う）
gcloud dns record-sets create www.sim-hikari-guide.com. \
  --zone="${ZONE}" \
  --type=A \
  --ttl=300 \
  --rrdatas="${APEX_IP}"
```

反映確認:

```bash
dig sim-hikari-guide.com A +short
dig www.sim-hikari-guide.com CNAME +short
vercel domains inspect sim-hikari-guide.com
```

---

## 7. 動作確認

```bash
curl -sI https://sim-hikari-guide.com | head -5
curl -sI https://www.sim-hikari-guide.com | head -5
```

期待:

- apex → `200`、HTTPS 有効
- www → `308` / `301` で apex へリダイレクト

---

## トラブルシュート

| 症状                           | 対処                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| `DEPLOYMENT_NOT_FOUND`         | `vercel deploy --prod` を再実行                                  |
| ビルド失敗                     | ローカルで `npm ci --prefix site && npm run build --prefix site` |
| ドメイン Invalid Configuration | `vercel domains inspect` の値と Cloud DNS を照合                 |
| ダッシュボード設定と競合       | Root Directory は**空**、`vercel.json` を優先                    |

---

## 参照

- [Vercel vercel.json](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Cloud DNS レコード](https://cloud.google.com/dns/docs/records)
