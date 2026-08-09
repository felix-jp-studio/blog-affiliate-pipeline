# GSC セットアップ — 並行作業チェックリスト

API 403 と UI skipped を **同時に** 解消するための手順。どちらか一方だけでは日次バッチが完全動作しません。

## トラック A: Service Account を GSC に追加（API 403 対策）

|  #  | 作業               | 詳細                                                                                                                           |
| :-: | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| A1  | SA メールを確認    | ローカルで JSON から取得: `node -e "console.log(JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON).client_email)"`               |
| A2  | GSC にユーザー追加 | [Search Console → ユーザーと権限](https://search.google.com/search-console/users?resource_id=sc-domain%3Asim-hikari-guide.com) |
| A3  | 権限               | **完全**（Full）を付与                                                                                                         |
| A4  | 確認               | `npm run gsc:verify-access` で Accessible properties にプロパティが表示されること                                              |

**ドメインプロパティと URL プレフィックスの両方がある場合** — どちらか一方に SA を追加すれば OK。verify-access が `Suggested GSC_SITE_URL` を出力します。

## トラック B: GSC_SITE_URL Secret 更新

プロパティ種類に合わせて GitHub Secret を設定します（A4 完了後、verify-access の提案値を使う）。

```bash
# ドメインプロパティの場合
./scripts/gh-user.sh secret set GSC_SITE_URL --body "sc-domain:sim-hikari-guide.com"

# URL プレフィックスの場合
./scripts/gh-user.sh secret set GSC_SITE_URL --body "https://sim-hikari-guide.com/"
```

| プロパティ種類     | Secret 値                                        |
| ------------------ | ------------------------------------------------ |
| ドメイン           | `sc-domain:sim-hikari-guide.com`                 |
| URL プレフィックス | `https://sim-hikari-guide.com/`（末尾 `/` 必須） |

## トラック C: Playwright セッション更新（UI skipped 対策）

|  #  | 作業               | 詳細                                                                                               |
| :-: | ------------------ | -------------------------------------------------------------------------------------------------- |
| C1  | ローカルでログイン | `npm run gsc:auth:login`（Chrome で Google ログイン）                                              |
| C2  | Secret 更新        | `base64 -i gsc-playwright-auth.json \| tr -d '\\n'` の出力を `GSC_PLAYWRIGHT_STORAGE_STATE` に登録 |
| C3  | 確認               | 次回 Run で UI 列が `requested` / `already_indexed` になること                                     |

```bash
./scripts/gh-user.sh secret set GSC_PLAYWRIGHT_STORAGE_STATE < <(base64 -i gsc-playwright-auth.json | tr -d '\n')
```

## 完了後: 再実行

A〜C 完了後、main に trigger を push して Workflow を起動:

```bash
# .github/trigger-gsc-inspect にタイムスタンプ行を追加 → PR → merge
# または Settings → Actions → GSC inspect daily → Run workflow
```

## 成功の判定

| 項目                 | 期待値                                                  |
| -------------------- | ------------------------------------------------------- |
| verify-access        | `OK — siteUrl=... verdict=PASS`（または NEUTRAL）       |
| Workflow Job summary | Preflight に Accessible properties 一覧                 |
| ops レポート         | UI ≠ skipped、API verdict あり                          |
| main                 | `chore(gsc): daily inspect batch` commit が push される |

## 関連

- [gsc-inspect-automation.md](../gsc-inspect-automation.md)
- Workflow preflight: `.github/workflows/gsc-inspect-daily.yml`
