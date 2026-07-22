# IndexNow 連携

記事 PR が main にマージされたあと、変更された記事 URL を [IndexNow](https://www.indexnow.org/documentation) 経由で Bing / Yandex 等に通知します。

## ファイル構成

| ファイル                                                                                        | 役割                                     |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [`config/indexnow.json`](../config/indexnow.json)                                               | 本番 URL・host・API エンドポイントの正本 |
| [`scripts/indexnow-ping.mjs`](../scripts/indexnow-ping.mjs)                                     | slug → URL 変換と IndexNow API POST      |
| [`scripts/e2e/changed-slugs.mjs`](../scripts/e2e/changed-slugs.mjs)                             | マージコミットから変更 slug を解決       |
| [`.github/workflows/indexnow-ping.yml`](../.github/workflows/indexnow-ping.yml)                 | main push（記事変更）後に自動 ping       |
| [`site/scripts/generate-indexnow-key-file.mjs`](../site/scripts/generate-indexnow-key-file.mjs) | ビルド時に `public/{key}.txt` を生成     |

## 環境変数

| 変数           | 設定先                                     | 説明                                          |
| -------------- | ------------------------------------------ | --------------------------------------------- |
| `INDEXNOW_KEY` | GitHub Actions Secrets / Vercel Production | IndexNow 検証キー（8–128 文字、`a-zA-Z0-9-`） |

**コミットしてよいもの**: `config/indexnow.json`、スクリプト、ワークフロー  
**コミットしてはいけないもの**: `INDEXNOW_KEY` 本体

### GitHub Actions

Settings → Secrets and variables → Actions → `INDEXNOW_KEY`

未設定の場合、ワークフローは `[skip] INDEXNOW_KEY is not set` で **正常終了** します（CI 失敗にしません）。

### Vercel（キーファイル公開）

IndexNow 仕様では `https://sim-hikari-guide.com/{key}.txt` にキー文字列そのものが配置されている必要があります。

1. [Bing Webmaster Tools](https://www.bing.com/webmasters) 等で IndexNow キーを生成
2. Vercel → `sim-hikari-guide-site` → Settings → Environment Variables → Production に `INDEXNOW_KEY` を設定
3. 次回デプロイで `site/scripts/generate-indexnow-key-file.mjs` が `public/{key}.txt` を自動生成

手動確認:

```bash
curl -s "https://sim-hikari-guide.com/{YOUR_KEY}.txt"
# => キー文字列がそのまま返る
```

## フロー

```
記事 PR merge → push main (site/src/content/articles/**)
  → indexnow-ping.yml
  → changed-slugs.mjs --no-fallback
  → indexnow-ping.mjs (INDEXNOW_KEY がある場合のみ POST)
```

## ローカル実行

```bash
# キー未設定 → スキップ（exit 0）
npm run indexnow:ping

# ドライラン（API 送信なし）
INDEXNOW_KEY=your-key-here npm run indexnow:ping -- --dry-run --slugs=sim-20gb-osusume

# slug 指定
INDEXNOW_KEY=your-key-here INDEXNOW_SLUGS=sim-20gb-osusume npm run indexnow:ping
```

## 関連

- [記事公開スケジュール](./article-publish-schedule.md) — auto-merge フロー
- [GitHub Secrets](./secrets.md) — シークレット一覧
