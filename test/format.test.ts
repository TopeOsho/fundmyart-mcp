import { describe, expect, it } from "vitest";
import {
  formatDeadline,
  getFunderName,
  isDeadlineExpired,
  normalizeTags,
  pickLatestGrantDate,
  truncateText,
} from "../src/format.js";

describe("getFunderName", () => {
  it("extracts and capitalises hostname label", () => {
    expect(getFunderName(null, "https://www.artscouncil.org.uk/grant")).toBe("Artscouncil");
    expect(getFunderName("https://heritage-fund.org.uk/apply", null as unknown as string)).toBe(
      "Heritage Fund",
    );
  });

  it("prefers application_url over url", () => {
    expect(getFunderName("https://www.funder.com", "https://www.other.com")).toBe("Funder");
  });

  it("returns fallback for invalid URLs", () => {
    expect(getFunderName(null, "not a url")).toBe("Arts Funder");
  });
});

describe("formatDeadline", () => {
  it("formats ISO date in en-GB", () => {
    expect(formatDeadline("2026-06-15")).toBe("15 Jun 2026");
  });

  it("recognises rolling deadlines", () => {
    expect(formatDeadline("rolling")).toBe("Rolling deadline");
    expect(formatDeadline("Rolling")).toBe("Rolling deadline");
  });

  it("returns original string when not a parseable date", () => {
    expect(formatDeadline("TBC")).toBe("TBC");
  });

  it("returns guidance fallback when null", () => {
    expect(formatDeadline(null)).toBe("Check official guidance");
  });
});

describe("isDeadlineExpired", () => {
  const today = new Date("2026-04-18T12:00:00Z");

  it("returns true for past dates", () => {
    expect(isDeadlineExpired("2026-01-01", today)).toBe(true);
  });

  it("returns false for future dates", () => {
    expect(isDeadlineExpired("2026-12-31", today)).toBe(false);
  });

  it("returns false for rolling", () => {
    expect(isDeadlineExpired("rolling", today)).toBe(false);
  });

  it("returns false for null or unparseable", () => {
    expect(isDeadlineExpired(null, today)).toBe(false);
    expect(isDeadlineExpired("TBC", today)).toBe(false);
  });

  it("returns false for today's date (boundary)", () => {
    expect(isDeadlineExpired("2026-04-18", today)).toBe(false);
  });
});

describe("normalizeTags", () => {
  it("trims whitespace and drops empties", () => {
    expect(normalizeTags(["  tag ", "", "other"])).toEqual(["tag", "other"]);
  });

  it("returns empty array for null", () => {
    expect(normalizeTags(null)).toEqual([]);
  });
});

describe("pickLatestGrantDate", () => {
  it("returns the most recent date as ISO", () => {
    const result = pickLatestGrantDate("2026-01-01", "2026-03-15");
    expect(result?.startsWith("2026-03-15")).toBe(true);
  });

  it("handles null values gracefully", () => {
    expect(pickLatestGrantDate(null, null)).toBe(null);
  });
});

describe("truncateText", () => {
  it("returns full text when under limit", () => {
    expect(truncateText("short", 20)).toBe("short");
  });

  it("truncates and adds ellipsis when over limit", () => {
    const result = truncateText("a".repeat(50), 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.endsWith("…")).toBe(true);
  });

  it("collapses whitespace", () => {
    expect(truncateText("a  b\nc", 20)).toBe("a b c");
  });
});
