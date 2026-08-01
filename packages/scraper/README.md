# 光回線 公式料金ページ スクレイパー

公式サイトの料金表を定期取得し、記事リライト・料金表更新の差分検知に使う Python パッケージ。

## 現状（v1）

- `hikari_prices.py` — HTTP GET + HTML パース（月額・工事費・キャンペーン注記）
- `data/hikari-prices-snapshot.json` — 正規化スナップショット
- `.github/workflows/hikari-price-scraper.yml` — 毎月 1 日 + `workflow_dispatch`
- 429 / 5xx はリトライ後 soft-fail（レート制限のみなら exit 0）
- フィクスチャ: `tests/fixtures/*.html`（ライブ取得が不安定なときの CI / ローカル）

## セットアップ

```bash
cd packages/scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m scraper.hikari_prices --dry-run
# または
python -m scraper.hikari_prices --fixture-dir tests/fixtures --dry-run
PYTHONPATH=. python -m unittest discover -s tests -q
```

## 出力

- `data/hikari-prices-snapshot.json` — version `1`（providers マップ）
- 差分 → `scripts/price-diff-rewrite-hook.mjs`（別 PR）が `rewrite-queue.csv` へ追記

## 関連

- [docs/hikari-price-scraper-design.md](../../docs/hikari-price-scraper-design.md)
- 収益ロードマップ Month 2: NURO / 光回線 料金改定スクレイパー
