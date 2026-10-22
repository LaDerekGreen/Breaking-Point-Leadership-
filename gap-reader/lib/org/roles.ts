export const ORG_ROLES = ["program_lead", "leader", "respondent", "senior_reviewer", "board_reviewer"] as const;
export type Role = (typeof ORG_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  program_lead: "Program lead",
  leader: "Leader",
  respondent: "Respondent",
  senior_reviewer: "Senior reviewer",
  board_reviewer: "Board reviewer",
};

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ORG_ROLES as readonly string[]).includes(v);
}
