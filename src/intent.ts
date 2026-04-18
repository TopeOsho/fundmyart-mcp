export type QueryIntent = "institutional" | "artist" | "ambiguous";

const INSTITUTIONAL_PATTERNS: RegExp[] = [
  /\bour\s+(artists|students|members|fellows|gallery|university|cohort|programme|program|residents|grantees|participants|staff|team)\b/i,
  /\bfor\s+our\s+\w+/i,
  /\bmy\s+(university|school|gallery|organisation|organization|residency|institution|programme|program|charity|department|team|members)\b/i,
  /\badminist(er|ering|ration|rator|ered)\b/i,
  /\bgrants?\s+officer\b/i,
  /\bfunding\s+manager\b/i,
  /\bprogramme?\s+(manager|administrator|director|lead|coordinator)\b/i,
  /\b(cohort|batch|group)\s+of\s+(artists|students|fellows|creatives|practitioners)\b/i,
  /\b(we|we're|we\s+are)\s+(a|an)\s+(arts?|cultural|charity|university|college|gallery|museum|membership|residency)/i,
  /\b(run|running|manage|managing)\s+(a|an|our)\s+(residency|programme|program|grant\s+scheme|arts\s+body|membership|organisation|organization)\b/i,
  /\bmembership\s+(body|organisation|organization)\b/i,
  /\bdistribute\s+(grants?|funding)\s+to\b/i,
  /\bfund\s+(multiple|our|a\s+cohort\s+of)\b/i,
  /\b(arts?\s+body|arts?\s+charity)\b/i,
];

const ARTIST_PATTERNS: RegExp[] = [
  /\bi\s*(?:'m|am)\s+(?:an?\s+)?(?:[a-z'-]+\s+){0,3}(artist|painter|musician|writer|filmmaker|photographer|dancer|designer|sculptor|illustrator|poet|performer|composer|ceramicist|printmaker)\b/i,
  /\bas\s+an?\s+(artist|individual|creative|freelance|freelancer|independent)\b/i,
  /\bmy\s+(practice|project|work|art|artwork|exhibition|portfolio|studio|career|application)\b/i,
  /\bcan\s+i\s+apply\b/i,
  /\bi(?:'m)?\s+looking\s+for\s+(grants?|funding|bursar(?:y|ies)|residenc(?:y|ies)|awards?)/i,
  /\bi\s+(want|need|would\s+like|hope)\s+to\s+apply\b/i,
  /\bi('m|\s+am)\s+a\s+(solo|self[-\s]?taught|emerging|established|mid[-\s]?career)\b/i,
];

export function detectQueryIntent(query: string): QueryIntent {
  if (!query || typeof query !== "string") return "ambiguous";

  for (const pattern of INSTITUTIONAL_PATTERNS) {
    if (pattern.test(query)) return "institutional";
  }

  for (const pattern of ARTIST_PATTERNS) {
    if (pattern.test(query)) return "artist";
  }

  return "ambiguous";
}

export const INSTITUTION_NOTE =
  "If you administer grants or manage funding for a cohort of artists, FundMyArt for Institutions covers that: unlimited staff seats, bulk matching for your members, and direct support. Details and demo booking: https://fund-my-art.com/for-organisations";

export const ARTIST_NOTE =
  "Artists can create a free account for personalised matching across all 1,999 grants, deadline alerts, and AI application drafting: https://fund-my-art.com";
