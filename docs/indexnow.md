# IndexNow 連携

記事 PR が main にマージされたあと、変更された記事 URL を [IndexNow](https://www.indexnow.org/documentation) 経由で Bing / Yandex 等に通知します。

## ファイル構成

| ファイル                                                                                        | 役割                                     |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [`config/indexnow.json`](../config/indexnow.json)                                               | 本番 URL・host・API エンドポイントの正本 |
| [`scripts/indexnow-ping.mjs`](../scripts/indexnow-ping.mjs)                                     | slug → URL 変換と IndexNow API POST      |
| [`scripts/e2e/changed-slugs.mjs`](../scripts/e2e/changed-slugs.mjs)                             | マージコミットから変更 slug を解決       |
| [`scripts/e2e/verify-indexnow-key.mjs`](../scripts/e2e/verify-indexnow-key.mjs)                 | 本番 / dist の `{key}.txt` を検証        |
| [`.github/workflows/indexnow-ping.yml`](../.github/workflows/indexnow-ping.yml)                 | main push（記事変更）後に自動 ping       |
| [`site/scripts/generate-indexnow-key-file.mjs`](../site/scripts/generate-indexnow-key-file.mjs) | ビルド時に `public/{key}.txt` を生成     |

## 環境変数

| 変数           | 設定先                                          | 説明                                          |
| -------------- | ----------------------------------------------- | --------------------------------------------- |
| `INDEXNOW_KEY` | GitHub Actions Secrets **と** Vercel Production | IndexNow 検証キー（8–128 文字、`a-zA-Z0-9-`） |

**コミットしてよいもの**: `config/indexnow.json`、スクリプト、ワークフロー  
**コミットしてはいけないもの**: `INDEXNOW_KEY` 本体

### セットアップチェックリスト（本番有効化）

IndexNow を有効にするには **同じキー文字列** を GitHub と Vercel の両方に設定します。

1. [Bing Webmaster Tools](https://www.bing.com/webmasters) → IndexNow でキーを生成（例: `abc123xyz789`）
2. **GitHub Actions** — `felix-jp-studio/blog-affiliate-pipeline` → Settings → Secrets and variables → Actions → New repository secret
   - Name: `INDEXNOW_KEY`
   - Value: 生成したキー文字列
3. **Vercel Production** — プロジェクト `sim-hikari-guide-site` → Settings → Environment Variables
   - Key: `INDEXNOW_KEY`
   - Value: **GitHub と同じ**キー文字列
   - Environment: **Production のみ**（Preview には不要）
4. Vercel で **Production を再デプロイ**（環境変数追加だけでは既存デプロイに反映されない）
5. 本番確認:

```bash
curl -s "https://sim-hikari-guide.com/{YOUR_KEY}.txt"
# => キー文字列がそのまま返る（改行なし）
```

6. CI 確認（ローカル）:

```bash
INDEXNOW_KEY=your-key-here npm run test:e2e:indexnow
# => [OK] verify-indexnow-key (production): 1 checked
```

### GitHub Actions

Settings → Secrets and variables → Actions → `INDEXNOW_KEY`

未設定の場合:

- `indexnow-ping.mjs` は `[skip] INDEXNOW_KEY is not set` で **正常終了**（CI 失敗にしない）
- `verify-indexnow-key.mjs` も同様にスキップ
- `post-deploy-smoke.yml` の IndexNow 検証ステップは **常に実行** されるが、キー未設定時はスクリプト内で skip

設定済みの場合:

- `post-deploy-smoke.yml` — site 変更の main push 後に本番 `{key}.txt` を GET 検証（未設定時はスクリプトが skip）
- `indexnow-ping.yml` — ping 前に本番キーファイルを検証（未公開なら ping 前に失敗）
- `scheduled-articles.yml` — 定期公開後の inline ping 前に同様に検証（`continue-on-error: true`）

### Vercel（キーファイル公開）

IndexNow 仕様では `https://sim-hikari-guide.com/{key}.txt` にキー文字列そのものが配置されている必要があります。

ビルド時（`site/package.json` の `npm run build`）に `site/scripts/generate-indexnow-key-file.mjs` が実行され、`INDEXNOW_KEY` がある場合のみ `public/{key}.txt` を書き出します。Astro ビルド後、`dist/{key}.txt` として本番に配信されます。

`INDEXNOW_KEY` 未設定時は `[indexnow] INDEXNOW_KEY unset — skipping key file generation` とログ出力し、ビルドは続行します。

## フロー

```
記事 PR merge → push main (site/src/content/articles/**)
  → indexnow-ping.yml
  → verify-indexnow-key.mjs (INDEXNOW_KEY がある場合)
  → changed-slugs.mjs --no-fallback
  → indexnow-ping.mjs (INDEXNOW_KEY がある場合のみ POST)

scheduled-articles.yml → main へ GITHUB_TOKEN 直接 push
  → push 連動 WF は起動しない（GitHub 制限）
  → 同一 job 内で publish slugs を解決し verify + indexnow-ping.mjs を実行
```

## ローカル実行

```bash
# キー未設定 → スキップ（exit 0）
npm run indexnow:ping
npm run test:e2e:indexnow

# 本番キーファイル検証
INDEXNOW_KEY=your-key-here npm run test:e2e:indexnow

# dist 検証（build 後）
cd site && INDEXNOW_KEY=your-key-here npm run build
cd .. && INDEXNOW_KEY=your-key-here node scripts/e2e/verify-indexnow-key.mjs --target=dist

# ドライラン（API 送信なし）
INDEXNOW_KEY=your-key-here npm run indexnow:ping -- --dry-run --slugs=sim-20gb-osusume

# slug 指定
INDEXNOW_KEY=your-key-here INDEXNOW_SLUGS=sim-20gb-osusume npm run indexnow:ping
```

## 関連

- [記事公開スケジュール](./article-publish-schedule.md) — auto-merge フロー
- [GitHub Secrets](./secrets.md) — シークレット一覧
