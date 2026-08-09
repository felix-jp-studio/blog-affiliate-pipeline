# 勝ちクエリクラスタ拡張（2026）

> **Agent prep** — GSC 上位クエリ確定前の種 KW。priority 286–300 を `keywords.seed.csv` に追加。

## 目的

既存の強いテーマ（格安SIM / NURO光 / 乗り換え / povo / 光回線）ごとに類似 KW を3本ずつ追加し、ロングテール供給を厚くする。

## クラスタ一覧（5 × 3 = 15 件）

| cluster       | priority | keyword                         | type               |
| ------------- | -------- | ------------------------------- | ------------------ |
| 格安SIM 比較  | 286–288  | 20GB / 無制限 / 1GB 比較        | comparison         |
| NURO光        | 289–291  | 評判 / 解約金 / マンション      | comparison         |
| 乗り換え      | 292–294  | キャンペーン / MNP / デメリット | comp/howto/trouble |
| povo          | 295–297  | 評判 / 料金 / 注意点            | comp/howto         |
| 光回線 戸建て | 298–300  | 戸建て / プロバイダ / 10G       | comparison         |

## GSC データ連携（将来）

User が GSC 28 日 CSV を共有後:

1. 上位クエリ TOP10 を本 doc に追記
2. 各クエリから類似 KW を `keywords.seed.csv` に追加（priority 301+）
3. `npm run gsc:import-rewrite-queue` で 11–30 位を rewrite-queue へ

## 関連

- `data/keywords.seed.csv`
- `docs/operations/gsc-rewrite-queue-import.md`
- roadmap: `win-kw-cluster-expansion`
