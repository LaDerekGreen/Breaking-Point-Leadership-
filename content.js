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
    actionStep: 'Before you read Chapter One, write down three decisions from the last two years you would make differently now. Next to each, note who was pushing on you and what you were protecting. Keep the page. You will need it.',
    reflectionQuestions: [
      'If someone ran an honest review of my leadership tomorrow, what would I be most afraid it found?',
      'Who on my team has stopped bringing me ideas, and when did it start?',
      'What do I do when pressure comes from above that my people can see and I cannot?',
      'If I wrote my breaking point in one sentence today, would it be true or flattering?'
    ]
  },

  /*
    Closing section: "Leading the Leader Who Broke", which follows the
    resolved chapters in Part Two. The summary is the book's "What This
    Story Teaches" passage that leads into these questions.
  */
  closing: {
    title: 'Leading the Leader Who Broke',
    label: 'Part Two',
    summary: [
      'If you work for a leader who breaks this way, three lessons from Nathan\'s year apply directly to you.',
      'First, know your leader. Learn their motivations, their fears, their wants, and their habits under pressure. Not so you can manage them in a cynical way, but because you will one day need to say something they do not want to hear, and you will need to say it in words they can accept. Nathan reached Warren because he tied the hard truth to the thing Warren most wanted to protect.',
      'Second, say early and plainly what you cannot carry. If your leader begins handing you work that belongs to their position, put it in writing and name the parts that require their authority, not yours. Loyalty that absorbs everything quietly is not loyalty to the organization. It is a way of keeping a broken leader comfortably broken.',
      'Third, stay out of rooms where you become the shield. If your leader needs to correct the people below them, the correction is theirs to make. Your presence will not protect them. It will only move the target onto you.',
      'When a leader breaks, the people around them are not helpless. The organization is depending on someone to bring that leader back. Very often, that someone is the person sitting closest to the door.'
    ],
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
    Epilogue: One Year Later. The book's full text, with italics removed.
  */
  epilogue: {
    title: 'One Year Later',
    label: 'Epilogue',
    leader: 'Calvin Brooks',
    sections: [
      {
        heading: 'Six Months In',
        paragraphs: [
          'The first relapse did not come during a crisis. It came on an ordinary Tuesday in September, which was what made it dangerous.',
          'Calvin had spent the morning on the phone with the CFO about a safety audit at the northern distribution center. Two forklift incidents in a month, no injuries, but enough for the insurer to start asking questions and for the CFO to start asking Calvin why he had not seen it coming. Calvin did not have a good answer. By the time he walked into the operations review at one o\'clock, he had been defending himself for three hours, and some part of him was still doing it.',
          'Owen Pratt was the newest plant manager on Calvin\'s team. He was thirty-four, eleven weeks into the job, and the first manager Calvin had hired since the review. He had been chosen through the comparison process Calvin now insisted on, and his record had beaten two internal candidates Calvin had known for years. Calvin had defended the choice to people who doubted it. He was proud of it.',
          'Owen was third on the agenda. He had a proposal to change how the northern center scheduled its forklift crews, moving from fixed shifts to rotations matched to inbound truck volume. He had pulled six months of data. He had talked to every crew lead. He had a single slide.',
          'He got about forty seconds into it.',
          '"We\'re not redesigning scheduling in the middle of an audit," Calvin said. "Fix the training gap first. Bring me this in the spring."',
          'The room went still in a way Calvin had not felt in months. Owen nodded, said "Understood," and started to close his laptop.',
          'And Calvin heard it. Not the words themselves, but the shape of them. That\'s not happening. Fix the vendor we have. He had said those words to Elena almost two years earlier, or come within a half second of saying them, and he had built an entire plan around never saying them again. He had written his breaking point at the top of a page: When pressure comes from above, I stop listening and start deciding. He had shown it on a slide to the people in this room.',
          'He had stopped listening forty seconds in. He had started deciding before Owen reached his second sentence.',
          'Elena was looking at the table. Raymond Pike was looking directly at Calvin, and his face said nothing at all, which said everything.',
          '"Owen," Calvin said. "Wait."',
          'Owen stopped with the laptop half closed.',
          '"I did the exact thing I told all of you I would stop doing. I\'ve been on the phone with finance all morning about the audit, and I walked in here already decided. That\'s not on you. Open it back up. I have two questions before I have an opinion."',
          'Owen opened the laptop slowly, the way people do when they are not sure the door will stay open.',
          '"First question," Calvin said. "How does this fail?"',
          'Owen took a breath. "The rotation only works if the inbound schedule is accurate a day ahead. Right now it\'s accurate about eighty percent of the time. On the other twenty percent, we\'d be short a crew for part of a shift."',
          '"And the second. What does this have to do with the forklift incidents?"',
          'This was the part Owen had never reached. "Both incidents happened in the last hour of a ten-hour shift, during an inbound surge the fixed schedule didn\'t plan for. Same crew both times. They were tired, and they were rushing. The training gap is real, but it isn\'t why those incidents happened. The schedule is."',
          'Nobody spoke for a moment.',
          'Calvin had spent the entire morning telling the CFO the incidents were a training problem. He had been preparing to tell the insurer the same thing. He had been about to send the one person in the room who had found the actual cause back to his desk with instructions to fix the wrong problem.',
          '"How long would a pilot take?" Calvin asked.',
          '"Two weeks on one crew. I\'d want the crew lead\'s agreement before we start."',
          '"You have mine. Get theirs." Calvin turned to the room. "And for the record, since we keep one now. I broke today. I want it on the notes."',
          'Raymond wrote something down. Calvin would have given a great deal to know what it was.'
        ]
      },
      {
        heading: 'The Conversation After',
        paragraphs: [
          'Calvin asked Owen to stay when the meeting ended. Owen sat on the edge of his chair, notebook open, the same way Elena had once sat in that office. Calvin noticed it, and the noticing hurt more than he expected.',
          '"I owe you more than what I said in there," Calvin said. "When I cut you off, what did you think was going to happen?"',
          'Owen considered whether to answer honestly. Calvin could see him weigh it.',
          '"Honestly? I thought that was the end of it. Not the proposal, the job. Everybody told me about you before I started. They said you used to be hard to bring things to, that you\'d changed, but that the old version came out when finance leaned on you. I figured I\'d met him."',
          '"You did."',
          '"I almost didn\'t bring it," Owen said. "I had the data three weeks ago. I kept waiting for a good week."',
          'Calvin let that sit. Three weeks. In those three weeks, a tired crew had kept working ten-hour shifts through surges nobody planned for, because a new manager was waiting to see whether his boss was safe to approach. The cost of Calvin\'s breaking point had never been the meeting where it showed. It was every meeting people skipped because they expected it to.',
          '"There won\'t ever be a good week," Calvin said. "Bring it in a bad one. Especially then. If I do what I did today again, say so in the room. You won\'t lose anything for it. I\'ll make sure of that in writing."',
          'Owen closed his notebook. It was a small thing. Calvin noticed that too.'
        ]
      },
      {
        heading: 'What the Report Showed',
        paragraphs: [
          'On the first Monday of October, Calvin\'s monthly report arrived. He had read eight of them by now. Most had been quiet, a slow line of numbers moving in the right direction. This one had a flag on the second page.',
          'It marked the operations review. Time before giving an opinion: forty seconds, against an average that had grown to more than six minutes. The flag noted the context Calvin had entered himself that afternoon, the pressure from finance, the reversal, the two questions, the pilot approved. Then it showed him something he had not entered and had not known.',
          'In the four days before the meeting, while the audit pressure was building, Calvin had declined or deferred five requests from three different managers. Each one, alone, had a reason. Together, they matched the pattern from his first report almost exactly. The Tuesday meeting was not where he broke. It was where he finally noticed.',
          'Below that was the line Calvin would remember: Every flagged decision occurred during the same seventy-two-hour window of pressure from above.',
          'He had known his breaking point for a year. He had written it in his own handwriting. He had still not seen it arrive, because it did not arrive as a feeling. It arrived as five small, reasonable decisions that felt like efficiency while he made them.',
          'He went back to each of the three managers that week. Two of the five requests he approved. Two he still declined, and he explained why in writing. The fifth he could not remember well enough to judge, so he asked the manager to bring it again and promised two questions before an opinion.'
        ]
      },
      {
        heading: 'The Call to Walt',
        paragraphs: [
          'That Friday, Calvin called Walt. He told him all of it: the meeting, Owen\'s three weeks of waiting, the four days he had not seen, the report.',
          '"So you broke," Walt said.',
          '"I broke."',
          '"And you caught it in the room this time, instead of in a letter a year later. And then you found the part you didn\'t catch, and you went back and fixed that too." Walt paused. "Calvin, that\'s not failing the plan. That\'s the plan. You didn\'t write down that you\'d never break. You wrote down how you break. Nobody gets to the place where pressure stops working on them. The best you get is the place where you see it sooner."',
          '"It doesn\'t feel like progress."',
          '"It never does from inside it. Ask Owen in six months whether it was."',
          'The forklift pilot ran for two weeks. Late-shift incidents at the northern center dropped to zero, and they stayed there. The insurer closed its inquiry. Calvin told the CFO exactly where the fix had come from, and from whom, and he put Owen\'s name on the slide.',
          'In the next climate survey, one anonymous comment from the northern center read: The new plant manager actually listens to us, and I think it\'s because somebody finally listens to him.',
          'Calvin printed that one and kept it.'
        ]
      },
      {
        heading: 'One Year Later',
        paragraphs: [
          'The bad quarter came in March, the way Raymond Pike had predicted it would.',
          'A major customer cut its order volume by a third with two weeks of notice. The CFO wanted a recovery plan by Friday, and he wanted it from Calvin. By Wednesday, Calvin had not slept well in three nights, and the pressure from above was exactly the kind he had written at the top of his plan a year earlier.',
          'On Thursday morning, Raymond brought him a proposal to shift two production lines to a smaller customer the company had always treated as an afterthought. Calvin felt the answer form before Raymond finished his first sentence. Not now. We don\'t have time for experiments.',
          'He had the words ready. He did not say them.',
          '"How will this fail?" Calvin asked instead.',
          'Raymond paused. He had come in braced for a fight and had not prepared for a question. Then he walked Calvin through it: the retooling cost, the risk that the smaller customer could not absorb the volume, the two weeks of overlap where both lines would run below capacity. He had answers for most of it. For the rest, he said plainly, "I don\'t know yet."',
          '"What would you need to find out?"',
          '"Three days and a call with their operations director."',
          '"You have them," Calvin said. "And Raymond, I\'m under real pressure from the CFO on this. That\'s why I\'m asking hard questions, not because I doubt you."',
          'Raymond looked at him for a long moment. "You told us you\'d do that. Name the pressure."',
          '"I did."',
          'The plan worked, mostly. One line transferred cleanly. The other took six weeks longer than Raymond estimated, and the company absorbed a loss it would have avoided with more time. Calvin put both results on the next quarterly slide, under the same title he had used a year before: My Pattern.',
          'His numbers had held. The dismissal rate stayed well below where it had been. His time before giving an opinion had not slipped, even in March. SI had flagged one week, the worst week of the crisis, where he had overruled three recommendations in two days without asking a single question. He showed that too.',
          '"That was me breaking," he told the room. "I saw it the following Monday. Two of those three decisions, I reversed. The third one I\'d make again, and I told the manager why."',
          'Nobody laughed this time. Nobody needed to.',
          'After the meeting, Elena stayed behind. She had been promoted in January to director of supply chain, a role Calvin had recommended her for in writing, with the packaging decision as his first example.',
          '"Can I tell you something?" she said. "The review last year. Twenty-five people. If they did it again today, I think the answers would be different."',
          '"Different isn\'t finished," Calvin said.',
          '"No," she agreed. "But it\'s the first time I\'ve believed it was going somewhere."',
          'That night, Calvin took the framed philosophy down from his office wall. He did not throw it away. He set it on the credenza behind his desk, where visitors could no longer read it and he could see it every time he turned around.',
          'The words had never been the problem. They had been true the whole time. What had been missing was any way for Calvin to know whether he was living them. Now he had one, and so did his people.',
          'That is the whole argument of this book, in one office, in one year. Leaders do not need better values. They need to see the distance between the values they write down and the lives their people actually live under them. Calvin needed a letter to see it. The next leader should not have to wait for one.'
        ]
      }
    ]
  },

  /*
    Reading pages: Before the System Arrives, A Letter to the Reader and the
    Glossary. The text is the book's, with italics removed.
  */
  pages: [
    {
      id: 'monday',
      mark: 'M',
      title: 'Before the System Arrives',
      label: 'What you can do on Monday',
      card: 'Ten steps any leader can start this week, without a system.',
      sections: [
        {
          heading: '',
          paragraphs: [
            'Most leaders reading this book do not have SI. Their organization may never build it, or may take years to. That is not a reason to wait. Every leader in these pages, Calvin included, had choices available to them long before any system showed up, and the ones who grew used them.',
            'There is one more lesson to carry into this chapter. The observer in Chapter Four built a placement panel that worked. Promotions rose. Morale rose. When he left, it disappeared within a cycle, because it lived in one person. Everything below is built to survive that test. Do it yourself first, then build it so it keeps running after you are gone.'
          ]
        },
        {
          heading: '1. Write Your Breaking Point in One Sentence',
          paragraphs: [
            'Calvin\'s plan started with a single line: When pressure comes from above, I stop listening and start deciding. Writing it down made it real in a way no report could.',
            'Do the same. Think about the last three times you made a decision you regret. What was happening around you? Who was pushing? What were you protecting? The answer is usually one of five things this book has already named: comfort, convenience, misplaced trust, fear of standing alone, or your own seat. Write yours in one sentence, starting with "When." Keep it where you will see it before hard meetings.',
            'If you cannot think of a breaking point, that is not good news. It means you have a blind spot where your breaking point should be.'
          ]
        },
        {
          heading: '2. Ask Every Vantage Point',
          paragraphs: [
            'Calvin found out what sixteen people thought of him from a stranger. You can find out sooner. Choose one question and ask it of your boss, three peers, and everyone who reports to you: What do I do that makes it harder for you to tell me the truth?',
            'Do not collect the answers yourself. Ask someone neutral to gather them, and if any group is smaller than five people, have the answers combined with a larger group so no one can be traced. That one step fixes the flaw that silenced the observer\'s managers.',
            'Then compare the three views. Where your boss, your peers, and your team describe the same leader, you have your strengths. Where they describe different leaders, you have your blind spot.'
          ]
        },
        {
          heading: '3. Ask Two Questions Before You Give an Opinion',
          paragraphs: [
            'This is Calvin\'s first commitment, and it is the cheapest change in this book. When someone brings you a recommendation, ask at least two questions before you say what you think. How will this fail? What would you need from me? If you cannot think of two questions, you do not understand the idea well enough to reject it.',
            'Count them. Elena did. Your people will too.'
          ]
        },
        {
          heading: '4. Name the Pressure Out Loud',
          paragraphs: [
            'Every leader in this book was under pressure, and almost none of them said so. The pressure came out sideways instead: as impatience, as vague instructions, as cuts that landed on the people least able to push back.',
            'When pressure is coming from above, tell your team what it is. The CFO wants costs down eight percent this quarter. That is why I am pushing. People can work with a constraint they understand. They cannot work with a mood.'
          ]
        },
        {
          heading: '5. Translate Guidance on the Way Down',
          paragraphs: [
            'The observer watched guidance pass straight through every layer of his organization untouched, until the most junior people received a message written for the top and were left to guess what it meant for them.',
            'Every level is supposed to add context. Before you pass anything down, answer three questions in writing: What does this mean for my team specifically? What should they stop doing to make room for it? How will we know it worked? Then test it. Ask the most junior person affected to explain it back to you. If they cannot, you have not finished your job.'
          ]
        },
        {
          heading: '6. Choose the Few Things',
          paragraphs: [
            'Walt\'s advice to Calvin applies to every leader who walks into an organization and sees everything that is broken. You will not change a culture in two years by being right about all of it. Try, and you will either burn out angry or give the people who resist change a reason to stop you.',
            'Pick three things you can change within your actual authority. Write them down. Do those well, and let the rest wait. Three changes that last are worth more than thirty that disappear when you leave.'
          ]
        },
        {
          heading: '7. Put the Comparison on the Table',
          paragraphs: [
            'Renata did not lose because anyone argued against her. She lost because no one put the numbers side by side.',
            'For every selection you are part of, a hire, a promotion, an assignment, a seat on a board, insist on a one page comparison of each finalist\'s documented performance before anyone discusses fit, presence, or potential. If the room picks the weaker record, ask that the reason be written down in terms of performance. A real reason costs nothing to write. A comfortable one rarely survives being written.'
          ]
        },
        {
          heading: '8. Develop the Next Leader on Purpose',
          paragraphs: [
            'The observer saw strong performers held back for years because they were good at their current job. Units kept them in place to patch their own weak spots, and on paper those people looked stuck.',
            'Review the career path of everyone on your team at least once a year. Ask one question for each person: Is their next assignment building toward their next level, or toward my convenience? When a strong performer has mastered a role, move them up and give the role to someone who can grow into it. That is what teaching, coaching, and mentoring actually look like when they cost you something.'
          ]
        },
        {
          heading: '9. Protect the Person Who Speaks Up',
          paragraphs: [
            'The transfers the observer watched were handled correctly on paper, and they still failed, because the hallway carried a story the paperwork never did.',
            'When someone on your team raises a serious concern, the policy is the beginning of your job, not the end. Watch what happens to that person for the next ninety days. Are their assignments shrinking? Are their reviews dropping? Are peers treating them differently? If they move to a new team, call the receiving leader yourself and make sure the only story that arrives is the one in the formal record. Then keep checking.'
          ]
        },
        {
          heading: '10. Build It to Outlast You',
          paragraphs: [
            'This is the step most good leaders skip, and it is the reason most good practices die.',
            'For anything on this list that works, write it into a process someone else owns. Give it a name, a schedule, and a measure. Put it in the handover notes for whoever replaces you. Ask your successor, before you leave, whether they will keep it, and if not, why. A practice that depends on one person\'s conviction is a personality. A practice written into how the organization works is a system.'
          ]
        },
        {
          heading: 'What a System Adds',
          paragraphs: [
            'None of the steps above requires a machine. Every one of them is something a determined leader can start this week.',
            'What SI adds is the part no individual can sustain: doing all of it continuously, across every decision, without getting tired, without forgetting, and without leaving when the leader who started it moves on. SI is these ten steps running every day instead of once.',
            'You do not have to wait for it. Start with the sentence.'
          ]
        }
      ]
    },
    {
      id: 'letter',
      mark: 'L',
      title: 'A Letter to the Reader',
      label: 'From LaDerek Green',
      card: 'Three things the author asks of you.',
      sections: [
        {
          heading: '',
          paragraphs: [
            'If you have read this far, you have watched a lot of good people break.',
            'Marcus chose comfort. Priya chose convenience. Devon trusted the wrong room. Renata\'s committee chose silence. Grace nearly chose her own seat over the people she had protected for twenty years. Calvin opened a letter that told him sixteen people were afraid of him. Warren Hale went quiet in his office and let someone else take the hits.',
            'None of them set out to do harm. That is the point I most want you to carry out of this book. The leaders who do the most damage are rarely the ones who mean to. They are capable, experienced, often admired people who reach a moment where protecting something of their own quietly outweighs protecting someone else, and who never notice the trade being made.',
            'I have spent my career around leaders like that. I have worked for some. I have tried to save a few. And on more than one occasion, I have been one. There were weeks when I stopped listening because the pressure from above was loud. There were times I said yes to more than I should have carried because I wanted the organization to work, and I let others assume I could carry it. There were rooms I should have stayed out of and conversations I should have had sooner. I did not see most of those moments clearly while I was in them. I saw them later, the way Calvin saw his, when someone finally put the pattern in front of me.',
            'That is why this book exists. Not to tell you that you are a bad leader. You are probably a good one. That is exactly why your breaking point is dangerous. Good leaders are trusted, and trusted leaders are rarely checked.'
          ]
        },
        {
          heading: 'What I Am Asking of You',
          paragraphs: [
            'I am asking three things.',
            'First, find your sentence. Sit down this week with the first exercise in the workbook and write your breaking point in your own hand, beginning with the word "When." If it flatters you, write it again. Put it somewhere you will see it before the hard meetings. You will be surprised how often you need it.',
            'Second, ask the people below you. Your boss sees one leader. Your peers see another. The people who report to you see the one who matters most, and they are the least likely to tell you what they see unless you make it safe. Ask, protect their answers, and then tell them what you heard and what you will change. That single act will teach your team more about your character than anything you say in a meeting.',
            'Third, when you see someone else break, do not look away. It may be a peer who has stopped speaking up. It may be someone who reports to you whose team has gone quiet. It may be your own boss, hiding in an office while the organization drifts. Nathan did not have authority over Warren. What he had was knowledge of the man, and the courage to use it with care. You almost always have more influence than your title suggests. Use it to bring people back, not to bury them.'
          ]
        },
        {
          heading: 'What a System Can and Cannot Do',
          paragraphs: [
            'This book has argued for a system that watches leaders the way leaders have always watched everyone else. I believe in that argument. Some of you will build something like it. Many of you will never have it.',
            'But no system will ever do the most important part. A report can show Calvin his pattern. It cannot make him pick up a pen. A finding can show Grace who absorbed the cost. It cannot make her call her advisors in and ask them to argue against her. A record can show Marcus the name he never sponsored. It cannot buy the lunch.',
            'The system can hold up the mirror. Only you can decide what to do with what you see.'
          ]
        },
        {
          heading: 'The Envelope',
          paragraphs: [
            'At the beginning of this book, Calvin opened an envelope he did not expect. Most leaders never receive one. Nobody writes the letter, nobody runs the review, and the pattern keeps running until it costs someone a career, a promotion, a sense of safety at work, or the belief that telling the truth matters.',
            'You do not have to wait for the envelope. You can write it yourself, tonight, by being honest about the last three decisions you regret and what they had in common. You can ask your team to write it with you. And when it arrives, as it eventually does for every leader who stays in the work long enough, you can read it the way Calvin finally did: not as a verdict, but as the first honest picture anyone ever gave you.',
            'Every leader has a breaking point. The ones worth following are the ones who know where theirs is, tell the people around them, and keep coming back.',
            'Thank you for reading. Now go find your sentence.',
            'LaDerek Green'
          ]
        }
      ]
    },
    {
      id: 'glossary',
      mark: 'G',
      title: 'Glossary',
      label: 'Blind spots and breaking points',
      card: 'The terms this book uses, and where each one appears.',
      sections: [
        {
          heading: 'Moral Laziness',
          paragraphs: [
            'Knowing what\'s right, having proven you can do it, and declining the effort to sustain it once no one is watching. (Chapter One, Marcus)'
          ]
        },
        {
          heading: 'Convenience Over Fairness',
          paragraphs: [
            'Choosing what\'s easiest to execute and defend to your own boss over what\'s fair to the people under you. (Chapter Two, Priya)'
          ]
        },
        {
          heading: 'Misplaced Trust',
          paragraphs: [
            'Trust placed in a relationship or system that was never built to hold it, because no one defined its limits. (Chapter Three, Devon)'
          ]
        },
        {
          heading: 'Moral Cowardice',
          paragraphs: [
            'Having the information to make the right call and making the safe one, because defending the right one would cost you personally. (Chapter Four, Renata\'s committee)'
          ]
        },
        {
          heading: 'Self-Preservation',
          paragraphs: [
            'When protecting your people and protecting your seat collide, and no one is tracking which you choose. (Chapter Five, Grace)'
          ]
        },
        {
          heading: 'Blind Spot',
          paragraphs: [
            'A truth about a leader that the people around them can see and the leader cannot. Every breaking point above starts as one. (Prologue, Calvin)'
          ]
        }
      ]
    }
  ],

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
      summary: 'Twenty years. That\'s how long Grace spent at Vantwell Industrial building a reputation as someone who protects her people, fights for headcount, pushes back on cuts that would gut a team, and takes the hit personally rather than pass it down. People who worked under her tell the same handful of stories: the year she gave up her own bonus pool to save two positions on a struggling line, the time she sat in a budget meeting for six hours to keep a single analyst off a layoff list nobody else was fighting for. It wasn\'t performance. It was who she was, consistently, for twenty years, long before anyone was checking. Then she makes it to chief operating officer, the seat where every decision gets measured against quarterly shareholder returns. Eighteen months later the next round of cuts lands, and it lands on the same team it always lands on, the one with the least power to push back. The executive who spent twenty years protecting people has now signed off on sacrificing them.',
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
