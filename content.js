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
    Closing section: "Leading the Leader Who Broke", which follows the
    resolved chapters in Part Two. It turns from the reader's own breaking
    point to the leader above them.
  */
  closing: {
    title: 'Leading the Leader Who Broke',
    label: 'Part Two',
    summary: 'When the leader above you breaks, you are not helpless. Know your leader: their motivations, fears, wants and habits under pressure. Say early and plainly what you cannot carry. Stay out of rooms where you become the shield.',
    reflectionQuestions: [
      'If my own leader went quiet tomorrow, what do I know about their fears and wants that would help me bring them back?',
      'What am I carrying right now that belongs to someone with more authority than I have, and have I said so?',
      'When was the last time I stood in a room as someone else\'s shield, and what did it cost me afterward?',
      'If I were the one under pressure, who on my team knows me well enough to tell me I had stopped leading?'
    ],
    actionStep: 'Write down every responsibility you carry that your leader handed you informally. Next to each one, mark whether it requires authority you do not have. Take the list to your leader this month and ask for the marked items to be put in writing or taken back.',
    placeholder: false
  },

  /*
    Chapter modules. Self-assessment checklists, reflection questions,
    coaching instructions and action steps are the book's text.
  */
  chapters: [
    {
      id: 1,
      breakingPoint: 'comfort',
      title: 'Comfort',
      leader: 'Marcus',
      summary: 'Marcus votes fairly in one blind review, then goes back to sponsoring only people like himself.',
      focus: 'Who I sponsor and who I overlook.',
      assessmentQuestion: 'Who have I sponsored, who have I overlooked, and what do they have in common?',
      assessmentChecklist: [
        'Have I proven I can make a fair call inside a structured process, then gone back to old habits once the structure was gone?',
        'When I mentor or sponsor someone, do most of them share my background, my schools, or my network?',
        'Have I spoken up for an unfamiliar candidate once, then done nothing afterward to help them succeed?',
        'Do the real decisions on my team get made in rooms the whole candidate pool never enters?',
        'Have I joined a group complaint about a new process without checking the facts behind it myself?',
        'If my last ten hiring or promotion decisions were laid side by side, would the pattern surprise anyone who reports to me?'
      ],
      reflectionQuestions: [
        'Who is the last person I sponsored who did not remind me of myself?',
        'Where does the real decision get made in my organization, and who is never invited there?',
        'What fairness have I already proven I am capable of, and what would it cost me to sustain it every week?',
        'When a coalition forms around me, do I ask what it is protecting?'
      ],
      reflectionCoach: 'After each answer, push back with a harder follow up before you move on.',
      actionStep: 'List everyone you have mentored, sponsored, or recommended over the last three years, and write down what they have in common. Then choose one strong performer outside that pattern and put your name behind them, on the record, this quarter.',
      placeholder: false
    },
    {
      id: 2,
      breakingPoint: 'convenience',
      title: 'Convenience',
      leader: 'Priya',
      summary: 'Priya passes down a vague "collaborate" instruction in the way that protects her.',
      focus: 'Clarifying instructions and giving everyone an even start.',
      assessmentQuestion: 'Read the last instruction I passed down the way each person below me would. Where does it leave room to guess? When I have filled gaps like this before, whose interest did my reading protect?',
      assessmentChecklist: [
        'Have I passed down an instruction I did not fully understand because asking what it meant felt risky?',
        'When guidance from above was vague, did I resolve it in the direction that was safest for me?',
        'Does any process I run give some people a head start that others never get?',
        'Have I accepted credit for a result I knew came from the structure rather than the skill?',
        'Have I let an incomplete explanation spread because correcting it would have cost me?',
        'Do the people below me receive the same information at the same time?'
      ],
      reflectionQuestions: [
        'What is the last instruction I relayed without asking what it meant?',
        'Who on my team always goes first, and what does going first cost them?',
        'What question have I avoided asking my own boss, and what am I protecting by not asking it?',
        'If my team described the fairness of my processes, would their account match mine?'
      ],
      reflectionCoach: 'Do not accept an answer that sounds like an excuse.',
      actionStep: 'The next time an instruction reaches you with an undefined word in it, ask in writing what it means before you pass it down. Then give everyone it affects the same briefing at the same time.',
      placeholder: false
    },
    {
      id: 3,
      breakingPoint: 'trust',
      title: 'Misplaced Trust',
      leader: 'Devon',
      summary: 'Devon\'s openness is used against him because no one defined its limits.',
      focus: 'Sharing reasoning, not exposure; writing a one page "How I Share."',
      assessmentQuestion: 'Where am I sharing personal exposure when I should be sharing operational reasoning? Where have I gone quiet to protect myself?',
      assessmentChecklist: [
        'Do I share the reasoning behind my decisions with my whole team, in writing?',
        'Have I shared personal doubt with someone who reports to me and is competing for my role?',
        'After being burned, have I gone quiet and stopped explaining my decisions?',
        'Have I ever used something told to me in confidence in a performance or promotion conversation?',
        'Does my organization\'s guidance on openness say where the line is?',
        'Have I raised a gap in policy once and let it drop when nobody acted?'
      ],
      reflectionQuestions: [
        'What is the difference between my operational transparency and my personal disclosure?',
        'Who are the right people to hear my uncertainty, and who are the wrong ones?',
        'Where would a newer leader on my team learn where the line is?',
        'What did I stop sharing after the last time my trust was broken, and who paid for that silence?'
      ],
      reflectionCoach: 'Press me on any answer where I blame the other person instead of the missing boundary.',
      actionStep: 'Write your own one page How I Share: what decisions and reasoning you share and with whom, where your uncertainty goes, and how you handle personal matters. Give it to your team and ask them to hold you to it.',
      placeholder: false
    },
    {
      id: 4,
      breakingPoint: 'standing',
      title: 'Fear of Standing Alone',
      leader: "Renata's committee",
      summary: 'Two committee members privately agree Renata is the stronger candidate and say nothing in the room.',
      focus: 'Putting the records side by side and speaking up.',
      assessmentQuestion: 'When have I agreed with a decision in the hallway and stayed silent in the room? What did I tell myself to justify it?',
      assessmentChecklist: [
        'Have I agreed privately that a decision was wrong and stayed quiet when it was made?',
        'Have I chosen a familiar candidate over a stronger one because the familiar one was easier to defend?',
        'When I read survey results, do I check whether the people closest to me could actually answer honestly?',
        'Have I dismissed frontline feedback because my senior team told me things were fine?',
        'Have I moved someone who raised a problem, told myself it was for their own good, and never checked what happened to them next?',
        'Have I passed along an informal warning about someone to their next boss?'
      ],
      reflectionQuestions: [
        'What is the last decision I watched go wrong without saying anything, and what did my silence protect?',
        'In the rooms I sit in, what are the unwritten rules about when it is safe to speak?',
        'If the people beneath me told me the truth about my leadership, how would I know?',
        'Who in my organization has paid the price for speaking up, and what did everyone else learn from watching it?'
      ],
      reflectionCoach: 'If my answer depends on someone else speaking first, point that out.',
      actionStep: 'In your next selection or review meeting, be the person who puts the records side by side and says what they show. If the room still chooses differently, ask that the reason be written down. It costs you one uncomfortable minute. Your silence costs someone else their career.',
      placeholder: false
    },
    {
      id: 5,
      breakingPoint: 'self',
      title: 'Self-Preservation',
      leader: 'Grace',
      summary: 'Grace spent twenty years protecting her people, once fighting six hours to keep one analyst off a layoff list. Eighteen months from her pension vesting date as chief operating officer, she signs off on cuts that land on the team with the least power to push back, and the two protégés she once saved help her call it stewardship.',
      focus: 'Noticing when I protect my seat at my people\'s expense, and choosing my people when the two collide.',
      assessmentQuestion: 'Who absorbed the cost of my last three hard decisions? Was it spread fairly, or did it land on the people least able to push back? What was I protecting at the time?',
      assessmentChecklist: [
        'Do the costs of hard decisions in my organization land on the same group most of the time?',
        'Before my last difficult cut, did I price out and document at least two real alternatives?',
        'Have I called a choice unavoidable when it was really the one safest for me?',
        'Do the advisors closest to me ever argue against me, or do they help me agree with myself?',
        'Is there a personal deadline or stake quietly shaping my decisions right now?',
        'Who, if anyone, checks my decisions the way I check everyone else\'s?'
      ],
      reflectionQuestions: [
        'What would I say to a manager who brought me the decision I am about to make?',
        'What did I give up the last time protecting my people cost me something?',
        'Who benefits from my silence about my own stake in the outcome?',
        'If the people who absorbed the last cut read my record, what would they say about me?'
      ],
      reflectionCoach: 'When I describe a choice as unavoidable, ask me what else I tried.',
      actionStep: 'Before your next major decision affecting people\'s jobs, ask your two most trusted advisors to argue against it for one full hour. Write down every alternative they raise and why you rejected it. Keep that page.',
      placeholder: false
    }
  ]
};
