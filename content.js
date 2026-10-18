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
    The Breaking Point Workbook. Text from the book, with tables turned into
    lists and fields the reader can fill in.
  */
  workbook: {
    title: 'The Breaking Point Workbook',
    intro: [
      'The ten steps in the last chapter tell you what to do. This workbook gives you the tools to do it. Every exercise here can be done with a pen, a notebook, and the people you already work with. None of them requires software, a budget, or anyone\'s permission.',
      'Use it in order the first time. Each exercise builds on the one before it. After that, return to whichever one you need. Most leaders find that two or three of these become permanent habits and the rest become tools they pull out when pressure rises.',
      'One rule applies to every page: write your answers down. A breaking point you only think about stays comfortable. A breaking point you write in your own hand becomes something you can be held to, the way Calvin\'s was.'
    ],
    finalWord: [
      'None of these exercises will make you a different person. That was never the goal. Every leader in this book had the capacity to do the right thing. What they lacked was a way to see themselves clearly and a structure that kept them looking.',
      'This workbook is that structure, built by hand. It is slower than a system, and it depends on your honesty in a way a system does not. But it starts today, it costs nothing, and it puts you in the small group of leaders who choose to find their breaking point before it finds them.'
    ],
    exercises: [
      {
        id: 1,
        title: 'Find Your Breaking Point',
        time: 'One hour, alone.',
        body: [
          'Think of three decisions from the last two years that you regret, or that you would make differently now. Not mistakes of skill. Mistakes of judgment, where you knew better or should have. For each one, answer: What did I decide? What was happening around me that week? Who or what was pushing on me? What was I protecting? Who paid the cost of the decision?',
          'Now read across your answers. Most leaders find that one row repeats. The pressure comes from the same direction, or the thing being protected is the same, or the cost lands on the same kind of person. That repetition is your pattern.',
          'Compare what you found to the five breaking points in this book. Your pattern may match one, or blend two. Now write it in one sentence that begins with the word "When."',
          'Calvin\'s read: When pressure comes from above, I stop listening and start deciding. Yours should be as plain as that. If it sounds flattering, rewrite it. A breaking point that makes you look good is a blind spot wearing a disguise.',
          'Put the sentence somewhere you will see it before difficult meetings. Inside a notebook cover works. So does the first line of your calendar on Monday mornings.'
        ],
        link: {
          href: '#/start',
          label: 'Do this exercise in The Letter'
        },
        fields: [

        ]
      },
      {
        id: 2,
        title: 'The Three Vantage Point Survey',
        time: 'Two weeks, with help.',
        body: [
          'This is the exercise most leaders avoid, and the one that teaches the most. You will ask the people above you, beside you, and below you how they experience your leadership, and you will arrange it so they can answer honestly.',
          'Step one: choose a neutral collector. Do not collect the answers yourself. Ask someone you trust who does not report to you and is not competing with you: a human resources partner, a peer from another department, or an outside coach. Their job is to gather the responses, remove names, and give you only the combined results.',
          'Step two: protect small groups. If any group has fewer than five people, the collector combines its answers with another group before you see them. Your boss is a group of one, so your boss\'s answers are always combined with your peers\' answers or given to you directly in conversation instead. This is the single most important rule in the exercise.',
          'Step three: ask the same questions of everyone. Each is answered on a scale of one to five, from strongly disagree to strongly agree, with space for a written comment. Then add one open question for everyone: What does this leader do that makes it harder for you to tell them the truth?'
        ],
        list: [
          'This leader asks questions before giving an opinion.',
          'I can bring this leader bad news without worrying about how it will affect me.',
          'When this leader is under pressure, I can still predict how they will react.',
          'This leader explains the reasoning behind decisions that affect me.',
          'Assignments and opportunities from this leader are fairly distributed.',
          'This leader follows through on commitments they make to me.',
          'When I disagree with this leader, my view is considered seriously.',
          'This leader develops people for their next role, not only for their current one.'
        ],
        after: [
          'Step four: compare the three views. Ask the collector for average scores on each question, separated by group: above, beside, and below. Where all three groups agree, you have found your strengths and your known weaknesses. Where they disagree by a point or more, you have found your blind spots. Pay closest attention to any question where the people above you rate you high and the people below you rate you low. That gap is where Calvin lived for years without knowing it.',
          'Step five: tell people what you learned. Within two weeks of receiving the results, tell everyone who answered what you heard and one thing you will change. You do not need to share every score. You do need to show that answering mattered.'
        ],
        fields: [
          {
            key: 'collector',
            label: 'My neutral collector (a role, not a name)',
            type: 'text'
          },
          {
            key: 'scores',
            label: 'Average scores by group: above, beside, below (one line per question)',
            rows: 8
          },
          {
            key: 'gaps',
            label: 'Where the groups disagree by a point or more'
          },
          {
            key: 'change',
            label: 'What I will tell respondents, and one thing I will change'
          }
        ]
      },
      {
        id: 3,
        title: 'The Decision Log',
        time: 'Five minutes per decision, for ninety days.',
        body: [
          'SI is, at its core, a decision log that never stops running. You can build a small version yourself. For the next ninety days, record every significant decision that affects someone else\'s work, assignment, evaluation, or opportunity: the date, the decision, who it affected, the pressure you were under, the questions you asked first and the alternatives you considered.',
          'At the end of each month, read the log from top to bottom and answer three questions.'
        ],
        list: [
          'In how many decisions did I ask at least two questions first?',
          'Did the decisions I made under pressure look different from the ones I made without it?',
          'Do the people affected by my decisions share anything in common that I did not intend?'
        ],
        after: [
          'The log will feel tedious for two weeks. Then it will start to show you things. Calvin\'s flagged week, five small decisions he never noticed, is exactly the kind of pattern a log like this catches.'
        ],
        link: {
          href: '#/log',
          label: 'Open my decision log'
        },
        fields: [
          {
            key: 'month1',
            label: 'First monthly read: my answers to the three questions'
          },
          {
            key: 'month2',
            label: 'Second monthly read'
          },
          {
            key: 'month3',
            label: 'Third monthly read'
          }
        ]
      },
      {
        id: 4,
        title: 'The Comparison Sheet',
        time: 'Thirty minutes before any selection decision.',
        body: [
          'Use this for every hire, promotion, stretch assignment, or board seat you help decide. Complete it before the group discusses fit, presence, or potential. Remove names and program histories if you can. Compare each candidate on these measures.'
        ],
        list: [
          'Primary result in current role',
          'Result compared to target, last three years',
          'Retention or engagement of their team',
          'Hardest problem they solved, documented',
          'Development of people under them',
          'Times previously considered and not selected'
        ],
        after: [
          'After the discussion, if the group selects anyone other than the strongest record, complete one more line in writing: We selected ___ over the stronger documented record because ___.',
          'Then read the sentence aloud. A reason grounded in performance will survive being said out loud. A comfortable reason usually will not, and that moment of discomfort is the point. Renata\'s committee never had to write this sentence. If they had, the vote might not have been unanimous.',
          'Pay special attention to the last row. Someone who has been considered and passed over two or three times is the person most likely to be held in place for someone else\'s convenience.'
        ],
        fields: [
          {
            key: 'sheet',
            label: 'My comparison (Candidate A, B and C on each measure)',
            rows: 8
          },
          {
            key: 'sentence',
            label: 'We selected ___ over the stronger documented record because ___',
            rows: 2
          }
        ]
      },
      {
        id: 5,
        title: 'The Instruction Translator',
        time: 'Fifteen minutes per instruction.',
        body: [
          'Before you pass any significant instruction down to your team, complete this worksheet. Priya never did.'
        ],
        after: [
          'After you brief your team, ask the most junior person affected to explain the instruction back to you in their own words. If their version does not match yours, the gap is yours to close, not theirs.'
        ],
        fields: [
          {
            key: 'received',
            label: 'The instruction as I received it'
          },
          {
            key: 'word',
            label: 'Any word in it that could mean more than one thing',
            type: 'text'
          },
          {
            key: 'clarify',
            label: 'What I asked my own boss to clarify, and their answer'
          },
          {
            key: 'meaning',
            label: 'What this means for my team specifically'
          },
          {
            key: 'stop',
            label: 'What my team should stop doing to make room for it'
          },
          {
            key: 'worked',
            label: 'How we will know it worked'
          },
          {
            key: 'headstart',
            label: 'Does it give anyone on my team a head start that others will not get? If yes, how will I level it?'
          }
        ]
      },
      {
        id: 6,
        title: 'The Placement Review',
        time: 'One afternoon per year, with help.',
        body: [
          'Once a year, review every person on your team against their likely career path. First, bring in one person who knows career paths better than you do, such as a human resources partner or a senior colleague from another department.',
          'Then complete one line for each person, covering these columns.'
        ],
        list: [
          'Time in current role',
          'Has mastered this role?',
          'Next role that would grow them',
          'Am I keeping them here for my convenience?',
          'Action and date'
        ],
        after: [
          'The fourth column is the one that matters. Answer it honestly. If someone is in their role mainly because they make your numbers look good, write that down. Then decide whether you will move them forward this year, and write the date.',
          'Finally, write a one page description of how you ran the review and give it to your own boss and to whoever is most likely to replace you. A written process has a chance to survive you.'
        ],
        fields: [
          {
            key: 'lines',
            label: 'One line per person (describe roles, not names)',
            rows: 8
          },
          {
            key: 'process',
            label: 'How I ran the review',
            rows: 5
          }
        ]
      },
      {
        id: 7,
        title: 'The Speak Up Tracker',
        time: 'Ten minutes a month, for ninety days after each concern.',
        body: [
          'When anyone on your team raises a serious concern, about safety, ethics, fairness, or treatment, open a private page for them and track what happens next. The point is not to watch the person. It is to watch what the organization does to them. At day 30, day 60 and day 90, check each of these.'
        ],
        list: [
          'Have their assignments changed in size or quality?',
          'Has their most recent evaluation changed without documented cause?',
          'Are peers treating them differently?',
          'Have they been left out of meetings they used to attend?',
          'Have I personally checked in with them?',
          'If they moved teams, have I spoken with their new leader?'
        ],
        after: [
          'If any answer worries you, act on it that week. Do not wait for a formal complaint. By the time one arrives, the damage has usually been done.'
        ],
        fields: [
          {
            key: 'concern',
            label: 'The concern raised (describe the role, not the name)',
            rows: 2
          },
          {
            key: 'day30',
            label: 'Day 30'
          },
          {
            key: 'day60',
            label: 'Day 60'
          },
          {
            key: 'day90',
            label: 'Day 90'
          }
        ]
      },
      {
        id: 8,
        title: 'The Pressure Briefing',
        time: 'Five minutes, whenever pressure rises.',
        body: [
          'When significant pressure comes from above, tell your team about it before it can come out sideways. Use this short script, adapted to your own voice.'
        ],
        after: [
          'Close with: "If you see me react to this in a way that is not fair to you, tell me."',
          'The fourth line is the one most leaders leave out. Say it anyway. It tells your team where your line is, and it reminds you.'
        ],
        fields: [
          {
            key: 'above',
            label: 'Here is what is happening above us:',
            rows: 2
          },
          {
            key: 'deliver',
            label: 'Here is what I have been asked to deliver:',
            rows: 2
          },
          {
            key: 'week',
            label: 'Here is what that means for us this week:',
            rows: 2
          },
          {
            key: 'willNot',
            label: 'Here is what I will not do, even under this pressure:',
            rows: 2
          }
        ]
      },
      {
        id: 9,
        title: 'Your Ninety Day Plan',
        time: 'Thirty minutes to set up, ten minutes each week after.',
        body: [
          'Bring the other exercises together into a single ninety day plan. Write your breaking point at the top of the page, then work through the weeks below.'
        ],
        weeks: [
          'Write my breaking point (Exercise 1)',
          'Choose a collector and launch the survey (Exercise 2)',
          'Start the decision log (Exercise 3)',
          'Receive survey results and complete the gap table',
          'Tell respondents what I learned and one change I will make',
          'Use the comparison sheet on the next selection (Exercise 4)',
          'Translate the next instruction I receive (Exercise 5)',
          'First monthly read of my decision log',
          'Brief my team before the next pressure point (Exercise 8)',
          'Complete the placement review (Exercise 6)',
          'Review any open speak up trackers (Exercise 7)',
          'Second monthly read of my decision log',
          'Ask the same survey questions again and compare'
        ],
        after: [
          'In week thirteen, compare your new survey results with the first. Do not expect perfection. Calvin\'s numbers improved and he still broke in month six. Look for the gap between how you see yourself and how others see you. If it has narrowed, the plan is working. If it has not, return to your breaking point sentence and ask whether it is honest.'
        ],
        link: {
          href: '#/plan',
          label: 'Open my 90 day plan'
        },
        fields: [

        ]
      }
    ]
  },

  /*
    Epilogue: One Year Later. The summary is condensed from the book; the quote
    and closing lines are the book's text.
  */
  epilogue: {
    title: 'One Year Later',
    label: 'Epilogue',
    leader: 'Calvin Brooks',
    summary: [
      'Six months in, on an ordinary Tuesday after a morning defending himself to the CFO, Calvin cuts off Owen, his newest plant manager, forty seconds into a proposal. Then he hears it. He stops, names what he did in the room, and asks two questions before giving an opinion. Owen\'s answer finds the real cause of two forklift incidents: the schedule, not the training. Owen had waited three weeks for a good week to bring it.',
      'Calvin\'s next report shows what he missed: in the four days before that meeting he had declined or deferred five requests from three managers, all during the same window of pressure from above. He goes back to each of them.',
      'One year later, a bad quarter arrives. When Raymond brings a proposal, Calvin feels the old answer form and asks instead, "How will this fail?" He names the pressure he is under. He shows the room the week he broke, and what he reversed.'
    ],
    quote: 'You didn\'t write down that you\'d never break. You wrote down how you break. Nobody gets to the place where pressure stops working on them. The best you get is the place where you see it sooner.',
    quoteBy: 'Walt',
    closing: 'Leaders do not need better values. They need to see the distance between the values they write down and the lives their people actually live under them. Calvin needed a letter to see it. The next leader should not have to wait for one.'
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
