import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  defaultCtaPlacement,
  resolveCtaPlacement,
} from "../src/data/cta-placement.ts";

describe("cta placement config", () => {
  it("defaults to after-table variant A", () => {
    assert.equal(defaultCtaPlacement, "after-table");
    assert.equal(resolveCtaPlacement(undefined), "after-table");
  });

  it("uses slug override for variant B", () => {
    assert.equal(
      resolveCtaPlacement("sim-20gb-osusume"),
      "before-conclusion",
    );
  });

  it("prefers markdown comment override", () => {
    assert.equal(
      resolveCtaPlacement("sim-20gb-osusume", "after-table"),
      "after-table",
    );
  });
});
