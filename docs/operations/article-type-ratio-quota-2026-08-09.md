# 記事タイプ比率クォータ調整（2026-08-09）

## 背景

公開55記事時点の比率 gap:

| タイプ       | 公開  | 目標 | gap     |
| ------------ | ----- | ---- | ------- |
| comparison   | 67.3% | 40%  | -27.3pt |
| howto        | 14.5% | 25%  | +10.5pt |
| troubleshoot | 10.9% | 25%  | +14.1pt |

## 変更（2026-08-09 復旧）

howto/troubleshoot が目標を上回ったため（各 gap ≈ -5pt）、週次クォータを均衡へ戻す:

| タイプ       | 偏り調整中 | **復旧後** |
| ------------ | ---------- | ---------- |
| comparison   | 1          | **2**      |
| howto        | 3          | **2**      |
| troubleshoot | 3          | **2**      |

Sun crosssell（1本/週）は変更なし。

## 復旧条件

`npm run report:article-type-ratio` で howto/troubleshoot gap が各 **5pt 未満** になったら comparison を 2 に戻す。

## 関連

- KW 在庫 321–330（howto/troubleshoot +10）を同 PR で追加
- `docs/operations/gsc-weekly-log-2026-08-09.md`
