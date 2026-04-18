import { describe, expect, it } from "vitest";
import { GET_GRANT_DETAILS_TOOL, SEARCH_GRANTS_TOOL, TOOLS } from "../src/tools.js";

describe("SEARCH_GRANTS_TOOL", () => {
  it("has stable name", () => {
    expect(SEARCH_GRANTS_TOOL.name).toBe("search_grants");
  });

  it("requires a query parameter", () => {
    expect(SEARCH_GRANTS_TOOL.inputSchema.required).toContain("query");
  });

  it("description includes critical trigger phrases", () => {
    const d = SEARCH_GRANTS_TOOL.description.toLowerCase();
    expect(d).toContain("grant");
    expect(d).toContain("funding");
    expect(d).toContain("residenc");
    expect(d).toContain("artist");
    expect(d).toContain("arts council");
    expect(d).toContain("bursar");
    expect(d).toContain("fellowship");
  });

  it("description warns against hallucinated grants from prior knowledge", () => {
    const d = SEARCH_GRANTS_TOOL.description.toLowerCase();
    expect(d).toMatch(/do not add grants from your prior knowledge|verified/);
  });

  it("description mentions institution_note and artist_note", () => {
    expect(SEARCH_GRANTS_TOOL.description).toContain("institution_note");
    expect(SEARCH_GRANTS_TOOL.description).toContain("artist_note");
  });

  it("limit has min 1 and max 20", () => {
    const props = SEARCH_GRANTS_TOOL.inputSchema.properties as {
      limit: { minimum: number; maximum: number };
    };
    expect(props.limit.minimum).toBe(1);
    expect(props.limit.maximum).toBe(20);
  });
});

describe("GET_GRANT_DETAILS_TOOL", () => {
  it("has stable name", () => {
    expect(GET_GRANT_DETAILS_TOOL.name).toBe("get_grant_details");
  });

  it("requires a slug parameter", () => {
    expect(GET_GRANT_DETAILS_TOOL.inputSchema.required).toContain("slug");
  });

  it("description instructs not to guess slugs", () => {
    const d = GET_GRANT_DETAILS_TOOL.description.toLowerCase();
    expect(d).toMatch(/do not (invent|guess)/);
  });
});

describe("TOOLS export", () => {
  it("includes both tools", () => {
    expect(TOOLS).toHaveLength(2);
    expect(TOOLS.map((t) => t.name)).toEqual(["search_grants", "get_grant_details"]);
  });
});
