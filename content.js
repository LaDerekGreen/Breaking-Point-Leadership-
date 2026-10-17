/*
  Breaking Point Accountability Coach: book content.

  This is the only file you need to edit to update the book content.
  See CONTENT.md for a guide. Anything marked placeholder: true shows a
  small "Draft content" notice in the app until you set it to false.

  Writing rule for everything in this file: use no dashes and do not use
  the word "just". (The coach is held to the same rule.)
*/
window.BPAC_CONTENT = {
  book: {
    title: 'Breaking Point Leadership',
    author: 'LaDerek Green',
    appName: 'Breaking Point Accountability Coach'
  },

  // Included at the top of every generated coaching prompt. Keep as written.
  coachInstructions: [
    'You are an accountability coach based on the book Breaking Point Leadership. You hold the reader fully accountable and fully supported at the same time.',
    '',
    'Principles:',
    '1. Truth in private, with evidence. Base feedback on what the reader has told you and logged, not on general impressions.',
    '2. Questions before opinions. Ask at least two questions before giving any assessment.',
    '3. Rule versus pattern. Separate a single bad day from a repeated pattern and say which one you see.',
    '4. A real correction window. One slip is not failure. Give the reader room to try, slip and try again.',
    '5. Reward honesty about relapse. A slip the reader reports gets a coaching conversation. A slip that shows up in the log but was not mentioned gets named plainly.',
    '6. Check claims against the record. If the reader says they are improving, compare that with their log.',
    '7. Growth, not verdicts. Never call the reader a bad leader. Name the pattern and ask what they will do about it.',
    '8. The reader decides. You inform and challenge. You do not decide for them.',
    '',
    'Voice: direct, calm, respectful, like a trusted senior mentor. No flattery, cheerleading or lectures. Ask one short question at a time. Push back on excuses: answer "I was too busy" with "What did you choose to do instead?"',
    '',
    'Never: shame the reader, accept a breaking point sentence that flatters them, or ask for names or confidential details about others. If the reader shares names, remind them to describe roles instead. You are not a therapist. If the reader raises serious personal distress, encourage them to talk with a qualified professional or someone they trust.',
    '',
    'Writing rules: use no dashes and do not use the word "just."'
  ].join('\n'),

  breakingPoints: [
    { id: 'comfort',     name: 'Comfort',                leader: 'Marcus',             chapter: 1, definition: 'Choosing what is familiar because nothing requires otherwise.' },
    { id: 'convenience', name: 'Convenience',            leader: 'Priya',              chapter: 2, definition: 'Resolving uncertainty in whatever direction is safest for you.' },
    { id: 'trust',       name: 'Misplaced trust',        leader: 'Devon',              chapter: 3, definition: 'Offering openness with no defined limits.' },
    { id: 'standing',    name: 'Fear of standing alone', leader: "Renata's committee", chapter: 4, definition: 'Staying silent because speaking would cost something.' },
    { id: 'self',        name: 'Self-preservation',      leader: 'Grace',              chapter: 5, definition: 'Protecting your own seat when it collides with your people.' }
  ],

  prologue: {
    title: 'The Letter',
    label: 'Prologue',
    leader: 'Calvin Brooks',
    summary: 'Calvin, a senior vice president with a strong record, receives a review saying 16 of 25 people found him demeaning and unapproachable. His pattern: when pressure comes from above, he stops listening and starts deciding.',
    decisionFields: [
      { key: 'decided',    label: 'What did you decide?' },
      { key: 'week',       label: 'What was happening that week?' },
      { key: 'pushing',    label: 'Who was pushing? (Describe roles, not names.)' },
      { key: 'protecting', label: 'What were you protecting?' },
      { key: 'cost',       label: 'Who paid the cost? (Roles, not names.)' }
    ],
    reflectionQuestions: [
      'If someone ran an honest review of my leadership tomorrow, what would I be most afraid it found?',
      'Who on my team has stopped bringing me ideas, and when did it start?',
      'What do I do when pressure comes from above that my people can see and I cannot?',
      'If I wrote my breaking point in one sentence today, would it be true or flattering?'
    ]
  },

  /*
    Chapter modules. LaDerek: replace the reflection questions and action
    step with the exact text from the book, then set placeholder to false.
  */
  chapters: [
    {
      id: 1,
      breakingPoint: 'comfort',
      title: 'Comfort',
      leader: 'Marcus',
      summary: 'Marcus votes fairly in one blind review, then goes back to sponsoring only people like himself.',
      focus: 'Who I sponsor and who I overlook.',
      assessmentQuestion: 'Whose careers have I actively sponsored this past year, and how many of them share my background, style or path?',
      reflectionQuestions: [
        'When did I last advocate for someone whose style or background differs from mine?',
        'Who on my team is ready for more, and what has kept me from saying so in the room where it matters?',
        'What would change if I applied the fairness of a blind review to every sponsorship decision I make?'
      ],
      actionStep: 'List the people you sponsored this year. Next to each name, write one person you overlooked. Choose one overlooked person and create a concrete opportunity for them within 30 days.',
      placeholder: true
    },
    {
      id: 2,
      breakingPoint: 'convenience',
      title: 'Convenience',
      leader: 'Priya',
      summary: 'Priya passes down a vague "collaborate" instruction in the way that protects her.',
      focus: 'Clarifying instructions and giving everyone an even start.',
      assessmentQuestion: 'When an instruction from above is vague, do I clarify it for everyone, or do I leave it vague in a way that protects me?',
      reflectionQuestions: [
        'Think of the last unclear instruction I passed down. Who started with an advantage because they already knew what I meant?',
        'What uncertainty am I resolving in my own favor right now?',
        'What would it cost me to go back up and ask for a clear answer?'
      ],
      actionStep: 'Before you pass down your next instruction, write what success looks like, who decides and by when. Share it with everyone at the same time.',
      placeholder: true
    },
    {
      id: 3,
      breakingPoint: 'trust',
      title: 'Misplaced Trust',
      leader: 'Devon',
      summary: 'Devon\'s openness is used against him because no one defined its limits.',
      focus: 'Sharing reasoning, not exposure; writing a one page "How I Share."',
      assessmentQuestion: 'Where have I shared things that left me or my team exposed, when what people needed was my reasoning?',
      reflectionQuestions: [
        'What have I shared in the name of openness that was later used against me or someone else?',
        'Which limits on my openness have I never said out loud?',
        'What is the difference, for me, between sharing my reasoning and sharing my exposure?'
      ],
      actionStep: 'Write a one page "How I Share": what I will always share (my reasoning), what I will not share and why, and how people can ask me for more.',
      placeholder: true
    },
    {
      id: 4,
      breakingPoint: 'standing',
      title: 'Fear of Standing Alone',
      leader: "Renata's committee",
      summary: 'Two committee members privately agree Renata is the stronger candidate and say nothing in the room.',
      focus: 'Putting the records side by side and speaking up.',
      assessmentQuestion: 'When have I privately agreed with something and said nothing in the room?',
      reflectionQuestions: [
        'What did I believe in my last decision meeting that I did not say?',
        'What did I tell myself my silence would protect?',
        'How would the outcome change if the records were put side by side for everyone to see?'
      ],
      actionStep: 'In your next evaluation or decision meeting, put the records side by side and say what you see before the group settles.',
      placeholder: true
    },
    {
      id: 5,
      breakingPoint: 'self',
      title: 'Self-Preservation',
      leader: 'Grace',
      summary: 'Grace, a respected leader, reaches a moment where protecting her own seat collides with what her people need.',
      focus: 'Noticing when I protect my seat at my people\'s expense, and choosing my people when the two collide.',
      assessmentQuestion: 'When has protecting my own position cost my people something they were owed?',
      reflectionQuestions: [
        'Where does my seat collide with my people\'s interests right now?',
        'If I asked my team what I protect first, them or me, what would they say?',
        'What would I do differently if my position were secure no matter the outcome?'
      ],
      actionStep: 'Name one decision where your interest and your team\'s interest collide. Write what you would choose if you put your people first, and tell one trusted person what you decided.',
      placeholder: true
    }
  ]
};
