import { describe, expect, it } from "vitest";
import { ARTIST_NOTE, INSTITUTION_NOTE, detectQueryIntent } from "../src/intent.js";

describe("detectQueryIntent — institutional", () => {
  it.each([
    "grants for our artists",
    "funding for our students' residency applications",
    "what can I offer our members?",
    "we're a membership body looking for partnership funding",
    "I administer a programme for emerging artists",
    "as a grants officer I need a database",
    "we run a residency and need to find matching grants",
    "funding to distribute to our cohort of fellows",
    "we're an arts charity supporting visual artists",
    "grants we can offer our gallery's artists",
  ])("detects institutional intent in: %s", (query) => {
    expect(detectQueryIntent(query)).toBe("institutional");
  });
});

describe("detectQueryIntent — artist", () => {
  it.each([
    "I'm a painter looking for grants",
    "as an artist I want to apply for residencies",
    "can I apply for Arts Council funding?",
    "what grants match my practice?",
    "I'm looking for funding for my project",
    "I want to apply for a bursary",
    "I'm an emerging digital artist in Scotland",
    "where can I find funding for my exhibition?",
  ])("detects artist intent in: %s", (query) => {
    expect(detectQueryIntent(query)).toBe("artist");
  });
});

describe("detectQueryIntent — ambiguous", () => {
  it.each([
    "what grants are open in 2026?",
    "art funding in the UK",
    "list residencies with deadlines this month",
    "show me film grants",
    "",
  ])("returns ambiguous for: %s", (query) => {
    expect(detectQueryIntent(query)).toBe("ambiguous");
  });

  it("handles invalid input gracefully", () => {
    expect(detectQueryIntent(undefined as unknown as string)).toBe("ambiguous");
    expect(detectQueryIntent(null as unknown as string)).toBe("ambiguous");
  });
});

describe("detectQueryIntent — institutional wins ties", () => {
  it("institutional keywords override first-person", () => {
    expect(detectQueryIntent("I administer grants for our artists")).toBe("institutional");
  });
});

describe("note copy", () => {
  it("institution note mentions for-organisations URL", () => {
    expect(INSTITUTION_NOTE).toContain("fund-my-art.com/for-organisations");
  });

  it("artist note mentions main domain without pricing", () => {
    expect(ARTIST_NOTE).toContain("fund-my-art.com");
    expect(ARTIST_NOTE).not.toMatch(/£|\$|€/);
    expect(ARTIST_NOTE.toLowerCase()).not.toContain("beta");
    expect(ARTIST_NOTE.toLowerCase()).not.toContain("early access");
  });
});
