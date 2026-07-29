# 光回線 公式料金ページ スクレイパー（Phase 2 v0 スケルトン）

公式サイトの料金表を定期取得し、記事リライト・料金表更新の差分検知に使う Python パッケージ。

## 現状（v0）

- `hikari_prices.py` — 取得対象 URL 定義 + HTTP GET スケルトン（パース未実装）
- `docs/hikari-price-scraper-design.md` — cron / GitHub Actions 設計

## セットアップ

```bash
cd packages/scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m scraper.hikari_prices --dry-run
```

## 出力（将来）

- `data/hikari-prices-snapshot.json` — 正規化した月額・工事費・キャンペーン
- 差分検知 → リライトキュー or 専用 PR

## 関連

- 収益ロードマップ Month 2: NURO / 光回線 料金改定スクレイパー v0
- `blog-affiliate-auto/config/roadmap-progress.json`
