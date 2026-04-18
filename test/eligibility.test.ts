import { describe, expect, it } from "vitest";
import { buildEligibilityChecklist, buildEligibilitySummary } from "../src/eligibility.js";

describe("buildEligibilitySummary", () => {
  it("returns fallback for null", () => {
    expect(buildEligibilitySummary(null)).toMatch(/official eligibility notes/i);
  });

  it("joins array of strings with bullet separator", () => {
    const summary = buildEligibilitySummary([
      "UK-based artists",
      "Individual applicants",
      "Project focus",
    ]);
    expect(summary).toContain(" • ");
  });

  it("flattens nested objects with humanised keys", () => {
    const summary = buildEligibilitySummary({
      geography: "England",
      career_stage: "Emerging",
    });
    expect(summary.toLowerCase()).toContain("england");
    expect(summary.toLowerCase()).toContain("emerging");
  });
});

describe("buildEligibilityChecklist", () => {
  it("returns exactly 3 bullets when data is sparse", () => {
    const bullets = buildEligibilityChecklist({ geography: "UK" });
    expect(bullets).toHaveLength(3);
  });

  it("returns 3 bullets for null with default guidance", () => {
    const bullets = buildEligibilityChecklist(null);
    expect(bullets).toHaveLength(3);
    expect(bullets[0]).toMatch(/eligibility notes/i);
  });

  it("deduplicates repeated fragments", () => {
    const bullets = buildEligibilityChecklist(["UK-based", "UK-based", "Emerging"]);
    const unique = new Set(bullets);
    expect(unique.size).toBe(bullets.length);
  });

  it("handles boolean true values by emitting the key label", () => {
    const bullets = buildEligibilityChecklist({ uk_based: true, disability_fund: true });
    const text = bullets.join(" ").toLowerCase();
    expect(text).toContain("uk based");
    expect(text).toContain("disability fund");
  });
});
