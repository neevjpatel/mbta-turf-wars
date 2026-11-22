// Schools that compete on the school leaderboard, and the email domains that prove membership.
// Names match the keys of CAMPUS_COLORS in app/_data/campuses.ts.
// A subdomain counts too (e.g. college.harvard.edu -> Harvard).
export const SCHOOL_DOMAINS = {
  BU: ["bu.edu"],
  MIT: ["mit.edu"],
  Harvard: ["harvard.edu"],
  Northeastern: ["northeastern.edu", "husky.neu.edu"],
  BC: ["bc.edu"],
} as const;

export type School = keyof typeof SCHOOL_DOMAINS;
export const SCHOOLS = Object.keys(SCHOOL_DOMAINS) as School[];

/** The school an email address belongs to, or null for any other address. */
export function schoolForEmail(email: string | null | undefined): School | null {
  const domain = email?.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;
  for (const school of SCHOOLS) {
    if (SCHOOL_DOMAINS[school].some((d) => domain === d || domain.endsWith(`.${d}`))) return school;
  }
  return null;
}

/** Games whose points also count for the player's school. Every other game is personal only. */
export const SCHOOL_GAMES = ["turf-wars"] as const;
