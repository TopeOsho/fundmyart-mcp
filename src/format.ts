export function getFunderName(applicationUrl: string | null, url: string): string {
  const sourceUrl = applicationUrl || url;

  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
    const [label] = hostname.split(".");
    return label
      .split(/[-_]/g)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Arts Funder";
  }
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) {
    return "Check official guidance";
  }

  if (deadline.toLowerCase().trim() === "rolling") {
    return "Rolling deadline";
  }

  const parsed = new Date(deadline);

  if (Number.isNaN(parsed.getTime())) {
    return deadline;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isDeadlineExpired(deadline: string | null, now: Date = new Date()): boolean {
  if (!deadline) return false;
  if (deadline.toLowerCase().trim() === "rolling") return false;

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return false;

  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  return parsed.getTime() < todayMidnight.getTime();
}

export function normalizeTags(tags: string[] | null): string[] {
  return (tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function pickLatestGrantDate(lastUpdated: string | null, lastVerifiedAt: string | null): string | null {
  const candidates = [lastUpdated, lastVerifiedAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());

  return candidates[0]?.toISOString() ?? null;
}

export function truncateText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
