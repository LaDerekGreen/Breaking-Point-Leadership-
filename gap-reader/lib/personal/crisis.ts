/**
 * B3: if the user's input or the model's response indicates crisis, the app
 * shows the 988 and 911 notice above the response and stops asking further
 * questions in that session. This is a cautious keyword check, not a
 * diagnosis; it errs toward showing the notice.
 */
const CRISIS: RegExp[] = [
  /\bkill(ing)? myself\b/i,
  /\bend(ing)? (it all|my life)\b/i,
  /\b(want|wanted|wish) to die\b/i,
  /\bsuicid\w*/i,
  /\bself[- ]?harm\w*/i,
  /\bhurt(ing)? myself\b/i,
  /\bcut(ting)? myself\b/i,
  /\bno reason to (live|go on)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\boverdos\w*/i,
  /\bcan'?t (go on|keep going)\b/i,
  /\b(988|crisis line|emergency services)\b/i,
  /\bin (immediate )?danger\b/i,
  /\bnot safe\b/i,
];

export function indicatesCrisis(text: string): boolean {
  return CRISIS.some((r) => r.test(text));
}

export const CAUTION = {
  heading: "Before you begin",
  lines: [
    "The Source Inquiry can show you the pattern. It cannot heal what made it.",
    "If what comes up is heavy, talk to a counselor or a doctor.",
    "In the United States, call or text 988 any time.",
    "If you are in immediate danger, call 911.",
    "Outside the United States, contact your local emergency number or crisis line.",
  ],
};

export const CRISIS_NOTICE = {
  heading: "Please reach out now",
  lines: [
    "In the United States, call or text 988 any time, day or night.",
    "If you are in immediate danger, call 911.",
    "Outside the United States, contact your local emergency number or crisis line.",
    "This session has stopped asking questions. Talking with a person is the next step.",
  ],
};
