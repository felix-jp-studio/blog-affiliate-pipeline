import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveGrantFromEvent } from "../src/lib/paywall/webhook.ts";

function event(type, object) {
  return { type, data: { object } };
}

const paidSession = {
  payment_status: "paid",
  metadata: { slug: "ahamo-esim-settei-tejun", buyerId: "buyer-1" },
};

test("入金済みの checkout.session.completed で解放する", () => {
  assert.deepEqual(
    resolveGrantFromEvent(event("checkout.session.completed", paidSession)),
    { slug: "ahamo-esim-settei-tejun", buyerId: "buyer-1" },
  );
});

test("後払いの入金完了（async_payment_succeeded）でも解放する", () => {
  assert.deepEqual(
    resolveGrantFromEvent(
      event("checkout.session.async_payment_succeeded", paidSession),
    ),
    { slug: "ahamo-esim-settei-tejun", buyerId: "buyer-1" },
  );
});

test("入金待ち（コンビニ払い等）では解放しない", () => {
  assert.equal(
    resolveGrantFromEvent(
      event("checkout.session.completed", {
        ...paidSession,
        payment_status: "unpaid",
      }),
    ),
    null,
  );
});

test("解放対象外のイベント種別は無視する", () => {
  for (const type of [
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
    "payment_intent.succeeded",
    "charge.refunded",
  ]) {
    assert.equal(resolveGrantFromEvent(event(type, paidSession)), null, type);
  }
});

test("メタデータが欠けている・壊れているセッションは無視する", () => {
  const broken = [
    {},
    { metadata: null },
    { metadata: { slug: "ahamo-esim-settei-tejun" } },
    { metadata: { buyerId: "buyer-1" } },
    { metadata: { slug: "../etc/passwd", buyerId: "buyer-1" } },
    { metadata: { slug: "Upper-Case", buyerId: "buyer-1" } },
  ];

  for (const session of broken) {
    assert.equal(
      resolveGrantFromEvent(
        event("checkout.session.completed", {
          payment_status: "paid",
          ...session,
        }),
      ),
      null,
      JSON.stringify(session),
    );
  }
});
