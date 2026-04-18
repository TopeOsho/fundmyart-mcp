import { describe, expect, it } from "vitest";
import { buildGrantSlugLookup, shortHash, slugifyGrantTitle } from "../src/slugify.js";

describe("slugifyGrantTitle", () => {
  it("lowercases and hyphenates a simple title", () => {
    expect(slugifyGrantTitle("Arts Council England Project Grant")).toBe(
      "arts-council-england-project-grant",
    );
  });

  it("strips accents via NFKD normalization", () => {
    expect(slugifyGrantTitle("Prix de l'Académie")).toBe("prix-de-l-academie");
  });

  it("converts ampersand to 'and'", () => {
    expect(slugifyGrantTitle("Art & Culture Fund")).toBe("art-and-culture-fund");
  });

  it("collapses multiple delimiters", () => {
    expect(slugifyGrantTitle("Grant — with: punctuation!!!")).toBe("grant-with-punctuation");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyGrantTitle("  !!!edge case!!!  ")).toBe("edge-case");
  });

  it("truncates to 120 characters without trailing hyphen", () => {
    const longTitle = "a ".repeat(100) + "grant";
    const slug = slugifyGrantTitle(longTitle);
    expect(slug.length).toBeLessThanOrEqual(120);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns fallback when title is all non-alphanumeric", () => {
    expect(slugifyGrantTitle("!!!")).toBe("grant");
    expect(slugifyGrantTitle("")).toBe("grant");
  });
});

describe("shortHash", () => {
  it("produces deterministic hashes for the same input", () => {
    expect(shortHash("abc")).toBe(shortHash("abc"));
  });

  it("produces different hashes for different inputs", () => {
    expect(shortHash("abc")).not.toBe(shortHash("xyz"));
  });

  it("respects length parameter", () => {
    expect(shortHash("abc", 4).length).toBeLessThanOrEqual(4);
    expect(shortHash("abc", 8).length).toBeLessThanOrEqual(8);
  });
});

describe("buildGrantSlugLookup", () => {
  it("returns base slug when title is unique", () => {
    const lookup = buildGrantSlugLookup([
      { id: "1", title: "Arts Council Grant" },
      { id: "2", title: "Heritage Fund Award" },
    ]);
    expect(lookup["1"]).toBe("arts-council-grant");
    expect(lookup["2"]).toBe("heritage-fund-award");
  });

  it("appends hash to duplicate titles", () => {
    const lookup = buildGrantSlugLookup([
      { id: "aaa", title: "Project Grant" },
      { id: "bbb", title: "Project Grant" },
    ]);
    expect(lookup["aaa"]).not.toBe(lookup["bbb"]);
    expect(lookup["aaa"].startsWith("project-grant-")).toBe(true);
    expect(lookup["bbb"].startsWith("project-grant-")).toBe(true);
  });

  it("handles three or more duplicates without collision", () => {
    const lookup = buildGrantSlugLookup([
      { id: "1", title: "Award" },
      { id: "2", title: "Award" },
      { id: "3", title: "Award" },
    ]);
    const slugs = Object.values(lookup);
    expect(new Set(slugs).size).toBe(3);
  });

  it("is deterministic across runs", () => {
    const items = [
      { id: "x", title: "Grant A" },
      { id: "y", title: "Grant A" },
      { id: "z", title: "Grant B" },
    ];
    const first = buildGrantSlugLookup(items);
    const second = buildGrantSlugLookup(items);
    expect(first).toEqual(second);
  });
});
