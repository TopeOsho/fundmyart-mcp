export function buildEligibilitySummary(eligibilityCriteria: unknown): string {
  const bullets = buildEligibilityChecklist(eligibilityCriteria);
  return bullets.length > 0
    ? bullets.join(" • ")
    : "Check the official guidance for eligibility criteria.";
}

export function buildEligibilityChecklist(eligibilityCriteria: unknown): string[] {
  const rawItems = collectEligibilityFragments(eligibilityCriteria);
  const uniqueItems = Array.from(
    new Set(
      rawItems
        .map((item) => item.replace(/\s+/g, " ").replace(/[.;:,]+$/g, "").trim())
        .filter(Boolean),
    ),
  );

  const bullets = uniqueItems
    .slice(0, 3)
    .map((item) => (item.endsWith(".") ? item : `${item}.`));

  if (bullets.length === 0) {
    return [
      "Review the official eligibility notes before you apply.",
      "Check whether your discipline, location, or career stage is covered.",
      "Confirm the deadline and required application materials early.",
    ];
  }

  while (bullets.length < 3) {
    bullets.push("Review the official guidance for any extra applicant requirements.");
  }

  return bullets;
}

function collectEligibilityFragments(value: unknown, label?: string): string[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectEligibilityFragments(item, label));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nestedValue]) =>
      collectEligibilityFragments(
        nestedValue,
        label ? `${label} ${humanizeKey(key)}` : humanizeKey(key),
      ),
    );
  }

  if (typeof value === "boolean") {
    return value && label ? [label] : [];
  }

  const text = `${value}`.replace(/\s+/g, " ").trim();
  if (!text) return [];

  if (!label || text.toLowerCase() === label.toLowerCase()) {
    return [text];
  }

  if (/^(yes|true)$/i.test(text)) {
    return [label];
  }

  return [`${label}: ${text}`];
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
