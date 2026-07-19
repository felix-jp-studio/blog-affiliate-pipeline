# Cursor × GitHub 連携セットアップガイド

Cursor エージェントが GitHub 上で **Issue / PR を作成**し、人間（あなた）が **GitHub 上でレビュー**できるようにするための推奨構成と手順。

対象リポジトリ: `felix-jp-studio/blog-affiliate-pipeline`

---

## 結論（推奨パス）

**Cursor 公式 GitHub App（ダッシュボード連携）＋ ローカルエージェント用 Machine User（`gh` CLI）** の 2 層構成を推奨する。

| レイヤー                            | 用途                                                                        | 認証方式                                                            |
| ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Cursor 公式 GitHub App**          | Cloud Agents、Bugbot、`@cursor` コメント起動                                | [cursor.com/dashboard](https://cursor.com/dashboard) → Integrations |
| **Machine User + fine-grained PAT** | Cursor Desktop（ローカル）エージェントの `gh pr create` / `gh issue create` | `gh auth login` で bot アカウント                                   |

> **カスタム GitHub App（自前で Developer Settings から作成）は不要。** Cursor は公式 App（[github.com/apps/cursor](https://github.com/apps/cursor)）を提供しており、Cloud Agents / Bugbot はこれを前提とする。

---

## 方式比較

### A) Machine User + fine-grained PAT

| 項目               | 内容                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| **概要**           | `felix-jp-studio-bot` 等の専用 GitHub アカウントを作り、PAT を `gh` CLI に設定                     |
| **Pros**           | PR/Issue の作成者が bot と明確に分離。ローカル Cursor エージェントから即 `gh` 利用可。監査しやすい |
| **Cons**           | アカウント作成・PAT ローテーションの手動運用。Org メンバー枠を 1 消費                              |
| **向いている場面** | ローカル Desktop エージェントで PR を量産し、自分の個人アカウントと区別したい                      |

### B) 自前 GitHub App

| 項目               | 内容                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **概要**           | Developer Settings で App を作成し、Installation + Private Key で API 操作                  |
| **Pros**           | 組織向け自動化の定番。権限を細かく設定可能                                                  |
| **Cons**           | Cursor 本体とは別物。**Cursor Cloud Agents / Bugbot には使えない**。Webhook・JWT 管理が必要 |
| **向いている場面** | Cursor 以外の CI/CD ボットを自前で作る場合                                                  |

### C) Cursor 公式 GitHub 連携（推奨・必須）

| 項目               | 内容                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **概要**           | Cursor Dashboard で GitHub を Connect。公式 App がリポジトリにインストールされる               |
| **Pros**           | Cloud Agents がブランチ作成→PR まで完結。Bugbot が PR レビュー。`@cursor` で Issue/PR から起動 |
| **Cons**           | ローカル Desktop エージェントの `gh` CLI には**自動では反映されない**（別途 A を設定）         |
| **向いている場面** | Cloud Agent / Bugbot / Autofix を使いたいすべてのケース                                        |

### D) GitHub Actions `GITHUB_TOKEN`

| 項目               | 内容                                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| **概要**           | ワークフロー内でのみ有効なトークン                                                |
| **Pros**           | 追加設定不要（既存 CI で利用中）                                                  |
| **Cons**           | **ローカル Cursor エージェントからは使えない**。PR 作成者は `github-actions[bot]` |
| **向いている場面** | CI 内の自動マージ等（本リポジトリの `design-docs-auto-merge.yml` はこれ）         |

---

## 現状（2026-07-19 時点）

| 項目              | 状態                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| `gh auth status`  | アクティブ: `felix-jp-studio`（scopes: `repo`, `workflow`, `read:org` 等） |
| 直近 PR 作成者    | すべて `felix-jp-studio`（bot ではない）                                   |
| Cursor 公式 App   | 未確認（Org 管理者権限が必要。Dashboard で Connect 要）                    |
| Branch Protection | **未設定**（Private リポジトリは GitHub Pro が必要）                       |
| 設計書 PR         | `docs/` のみ変更 → 自動 squash merge（`design-docs-auto-merge.yml`）       |
| PR 作成ルール     | `.cursor/rules/pr-review.mdc` — Bugbot レビュー後に `gh pr create`         |

---

## セットアップ手順

### Phase 1: Cursor 公式 GitHub App（Cloud Agents / Bugbot）

#### 1-1. Cursor Dashboard で接続

1. ブラウザで [https://cursor.com/dashboard](https://cursor.com/dashboard) を開く
2. 左メニュー **Integrations** を選択
3. **GitHub** の **Connect**（既に接続済みなら **Manage Connections**）をクリック
4. GitHub OAuth 画面で **`felix-jp-studio` org** を選択
5. リポジトリアクセス:
   - 最小権限: **Selected repositories** → `blog-affiliate-pipeline` のみ
   - 将来 Cloud Agent で他リポジトリも使うなら **All repositories** も可（要検討）
6. **Install & Authorize** をクリック

#### 1-2. 公式 App が要求する権限（参考）

Cursor 公式ドキュメントより（[GitHub integration](https://cursor.com/docs/integrations/github)）:

| 権限                   | 目的                                           |
| ---------------------- | ---------------------------------------------- |
| Repository access      | コード clone、作業ブランチ作成                 |
| Pull requests          | PR 作成、レビューコメント                      |
| Issues                 | レビュー中に発見したタスク管理                 |
| Checks and statuses    | CI 結果の参照                                  |
| Actions and workflows  | CI/CD 監視、PR からの再実行                    |
| Administration（read） | Branch protection / required checks の読み取り |

Webhook は **Cursor 側が管理**（自前設定不要）。

#### 1-3. Bugbot を有効化

1. Dashboard → **Bugbot**（または Integrations 内の Bugbot 設定）
2. `blog-affiliate-pipeline` を **ON**
3. 必要に応じて PR Preferences を調整:
   - Only Run when Mentioned
   - Only Run Once
   - Hide "No Bugs Found" Comments

#### 1-4. Cloud Agents 用 Secrets（任意）

Cloud Agent が API キー等を必要とする場合:

1. Dashboard → **Cloud Agents** → **Secrets**
2. チームスコープで Secret を追加（`.env` を repo にコミットしない）

---

### Phase 2: Machine User（ローカル Desktop エージェント用）

ローカル Cursor エージェントはターミナルの `gh` CLI を使う。PR/Issue の作成者を bot に分離する。

#### 2-1. bot アカウント作成（手動・要ログイン）

> **エージェントは GitHub アカウントを自動作成できない。** 以下は手動で実施。

1. ログアウトした状態で [https://github.com/signup](https://github.com/signup) を開く
2. 推奨ユーザー名: **`felix-jp-studio-bot`**
3. メール: 組織用メール（例: `felix.jp.studio@gmail.com` のエイリアス等）
4. 2FA を有効化（推奨）

#### 2-2. Org に bot を招待

1. [https://github.com/orgs/felix-jp-studio/people](https://github.com/orgs/felix-jp-studio/people) を開く（Org Owner でログイン）
2. **Invite member** → `felix-jp-studio-bot` を招待
3. Role: **Member**（Write 権限があれば十分。Admin は不要）
4. bot アカウント側で招待を Accept
5. リポジトリ `blog-affiliate-pipeline` へのアクセスを確認（Org 内 Private repo なら Member で可）

#### 2-3. fine-grained PAT 発行

bot アカウントでログインした状態:

1. [https://github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
2. Token name: `cursor-local-agent`
3. Resource owner: **`felix-jp-studio`**
4. Repository access: **Only select repositories** → `blog-affiliate-pipeline`
5. Permissions:

| カテゴリ          | 権限           | 理由              |
| ----------------- | -------------- | ----------------- |
| **Contents**      | Read and write | ブランチ push     |
| **Pull requests** | Read and write | PR 作成・更新     |
| **Issues**        | Read and write | Issue 作成        |
| **Workflows**     | Read and write | CI 再実行（任意） |
| **Metadata**      | Read-only      | 自動付与          |

6. **Generate token** → トークンを **1 回だけ表示される画面でコピー**（再表示不可）

#### 2-4. ローカル `gh` CLI に bot を設定

Cursor Desktop のターミナル（または macOS Terminal）で:

```bash
# 新しいホスト用に bot アカウントを追加（既存 felix-jp-studio は残す）
gh auth login -h github.com -p https -w

# ブラウザで felix-jp-studio-bot として認証
# または fine-grained PAT を直接貼り付け

# 確認
gh auth status
# → Active account: felix-jp-studio-bot になっていること

# 動作確認
cd /path/to/blog-affiliate-pipeline
gh issue create --title "test: cursor bot connectivity" --body "接続テスト（作成後すぐ Close 可）"
gh pr list --limit 3
```

> **複数アカウント切替**: `gh auth switch` で `felix-jp-studio`（人間）と `felix-jp-studio-bot`（エージェント）を切り替え可能。

#### 2-5. Cursor Desktop 側の設定

1. **Cursor → Settings → Integrations → GitHub**
   - 個人 GitHub アカウント（レビュー・通知用）を Connect しておく
2. **Cursor → Settings → Agents**
   - ターミナルコマンド実行を許可（`gh` 利用に必要）
3. リポジトリルール（`.cursor/rules/pr-review.mdc`）はそのまま有効
   - ローカル Bugbot サブエージェント → `gh pr create` の流れを維持

---

### Phase 3: レビュー受け取りフロー

#### 3-1. GitHub 通知

1. [https://github.com/settings/notifications](https://github.com/settings/notifications) で以下を ON:
   - **Pull request reviews**
   - **Pull requests**（Assigned / Participating）
2. bot が PR を作ると、あなた（`felix-jp-studio` または個人アカウント）に通知

#### 3-2. PR ラベルで識別（推奨）

エージェントに PR 作成時にラベルを付けるルールを追加:

```bash
gh pr create ... --label "cursor-agent"
```

GitHub → リポジトリ **Labels** で `cursor-agent`（色: 任意）を事前作成。

#### 3-3. CODEOWNERS（任意）

```
# .github/CODEOWNERS
* @go-kenji-konishi
```

bot PR でも指定ユーザーが自動 Assign される（Org 設定次第）。

#### 3-4. Branch Protection（GitHub Pro 必要）

Private リポジトリ `blog-affiliate-pipeline` では **GitHub Pro**（または Org Team plan）がないと Branch Protection が使えない。

Pro 加入後:

1. リポジトリ → **Settings → Branches → Add branch ruleset**
2. Target: `main`
3. 推奨設定:
   - **Require a pull request before merging**
   - **Require approvals**: 1（あなた自身）
   - **Require status checks to pass**: `CI / validate`
   - bot アカウントは **Bypass list に入れない**（必ず人間レビュー）

#### 3-5. 設計書 PR の自動マージ

`docs/` のみの変更 PR は既存 workflow で自動 squash merge 対象。bot 作成でも同じルールが適用される。

---

## セキュリティ

| 項目                | 推奨                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **トークン保存**    | PAT を repo にコミットしない。`gh` は OS keyring に保存。Cloud Secrets は Dashboard のみ           |
| **最小権限**        | fine-grained PAT は `blog-affiliate-pipeline` のみ。Org 全体の Admin 権限は付与しない              |
| **ローテーション**  | PAT は 90 日ごと、または漏洩疑い時に即 revoke → 再発行                                             |
| **2FA**             | bot アカウントにも 2FA 必須                                                                        |
| **監査**            | PR/Issue 作成者が `felix-jp-studio-bot` ならエージェント由来と即判別                               |
| **Cursor 公式 App** | [github.com/apps/cursor](https://github.com/apps/cursor) からのみインストール。第三者 App は避ける |

---

## カスタム GitHub App を作る場合（参考・通常は不要）

自前 App を作る場合のチェックリスト（Cursor 連携とは別用途）:

| 項目           | 値                                                              |
| -------------- | --------------------------------------------------------------- |
| App 名         | `cursor-agent`（例）                                            |
| Homepage URL   | `https://cursor.com`                                            |
| Permissions    | Contents RW, Pull requests RW, Issues RW, Actions R, Metadata R |
| Webhook events | `pull_request`, `issues`, `push`（外部 CI 連携時のみ）          |
| Installation   | `felix-jp-studio` org → `blog-affiliate-pipeline` のみ          |

> Cursor Desktop / Cloud Agents にはこの App は**そのままでは使えない**。汎用 GitHub API ボットとして別途スクリプトから利用する場合のみ検討。

---

## トラブルシューティング

| 症状                                   | 対処                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Cloud Agent が repo にアクセスできない | Dashboard → Integrations で App が `blog-affiliate-pipeline` にインストールされているか確認 |
| `gh pr create` が Permission denied    | `gh auth status` で bot アカウントが Active か確認。PAT 権限を再確認                        |
| Branch Protection が設定できない       | Private repo は GitHub Pro 必要。Free では Labels + 手動 merge で運用                       |
| Bugbot が動かない                      | Dashboard で Bugbot ON、有料プラン（Bugbot ライセンス）を確認                               |
| PR 作成者が人間アカウントのまま        | `gh auth switch` で bot に切替後、エージェントセッションを再起動                            |

---

## 参考リンク

- [Cursor GitHub integration](https://cursor.com/docs/integrations/github)
- [Cursor Cloud Agents](https://cursor.com/docs/cloud-agent)
- [Cursor Bugbot](https://cursor.com/docs/bugbot)
- [Cursor GitHub App](https://github.com/apps/cursor)
- [GitHub fine-grained PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
