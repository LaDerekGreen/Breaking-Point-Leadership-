/*
  Breaking Point Accountability Coach
  A free companion to Breaking Point Leadership by LaDerek Green.

  No server, no accounts, no AI calls. Everything is saved in this
  browser's localStorage. The app builds coaching prompts the reader
  copies into their own Claude account, then saves what they paste back.
*/
(function () {
  'use strict';

  var C = window.BPAC_CONTENT;
  var STORE_KEY = 'bpac.v1';
  var CLAUDE_URL = 'https://claude.ai/new';
  var PLAN_DAYS = 90;
  var MAX_COMMITMENTS = 3;
  var MAX_REGRETS = 3;

  /* ---------- State ---------- */

  function emptyRegret() { return { decided: '', week: '', pushing: '', protecting: '', cost: '' }; }

  function defaultState() {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      prologue: {
        storyRead: false,
        decisions: [emptyRegret()],
        reflections: {},
        coachReply: '',
        sentence: '',
        breakingPoints: [],
        evidence: '',
        savedAt: null
      },
      chapters: {},
      plan: null,
      pastPlans: [],
      log: [],
      checkins: [],
      checkinDraft: null,
      reviews: [],
      tools: { pre: { facing: '', pressure: '', tempted: '', protecting: '' }, reviewReply: '' },
      settings: { checkinDays: 7 }
    };
  }

  var storageOk = true;
  var state = load();

  function load() {
    var base = defaultState();
    var raw = null;
    try { raw = window.localStorage.getItem(STORE_KEY); } catch (e) { storageOk = false; }
    if (!raw) return base;
    try { return merge(base, JSON.parse(raw)); } catch (e) { return base; }
  }

  function merge(base, data) {
    if (!data || typeof data !== 'object') return base;
    Object.keys(data).forEach(function (k) {
      var b = base[k], d = data[k];
      if (b && d && typeof b === 'object' && !Array.isArray(b) && typeof d === 'object' && !Array.isArray(d)) {
        base[k] = merge(b, d);
      } else {
        base[k] = d;
      }
    });
    return base;
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
      storageOk = true;
    } catch (e) { storageOk = false; }
    document.getElementById('storage-warning').hidden = storageOk;
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); }
  window.addEventListener('pagehide', function () { if (saveTimer) save(); });
  window.addEventListener('beforeunload', function () { if (saveTimer) save(); });

  function chapterState(id) {
    var key = String(id);
    if (!state.chapters[key]) {
      state.chapters[key] = {
        storyRead: false,
        assessmentAnswer: '', assessmentSummary: '',
        reflectAnswers: {}, reflectionSummary: '',
        planText: '', planDraft: null, planSaved: false
      };
    }
    return state.chapters[key];
  }

  /* ---------- Helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function has(s) { return !!(s && String(s).trim()); }
  function orNone(s) { return has(s) ? String(s).trim() : '(not answered)'; }

  function todayISO() { return toISODate(new Date()); }
  function toISODate(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function parseDate(iso) { var p = String(iso).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(iso, n) { var d = parseDate(iso); d.setDate(d.getDate() + n); return toISODate(d); }
  function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
  function fmtDate(iso) {
    if (!iso) return '';
    return parseDate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split('.'), o = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = val;
  }

  function bp(id) { return C.breakingPoints.filter(function (b) { return b.id === id; })[0]; }
  function chapter(id) { return C.chapters.filter(function (c) { return String(c.id) === String(id); })[0]; }
  function bpNames(ids) { return (ids || []).map(function (id) { var b = bp(id); return b ? b.name : id; }).join(', '); }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* Form field builders. data-bind writes straight into state as the reader types. */
  function field(label, path, opts) {
    opts = opts || {};
    var val = getPath(state, path);
    var id = 'f_' + path.replace(/\W/g, '_');
    var hint = opts.hint ? '<p class="hint">' + esc(opts.hint) + '</p>' : '';
    var input;
    if (opts.type === 'date') {
      input = '<input type="date" id="' + id + '" data-bind="' + esc(path) + '" value="' + esc(val || '') + '">';
    } else if (opts.type === 'text') {
      input = '<input type="text" id="' + id + '" data-bind="' + esc(path) + '" value="' + esc(val || '') + '" placeholder="' + esc(opts.placeholder || '') + '">';
    } else {
      input = '<textarea id="' + id + '" data-bind="' + esc(path) + '" rows="' + (opts.rows || 3) + '" placeholder="' + esc(opts.placeholder || '') + '">' + esc(val || '') + '</textarea>';
    }
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + hint + input + '</div>';
  }

  /* ---------- Plan and record helpers ---------- */

  function planDay() {
    if (!state.plan) return 0;
    return Math.max(1, Math.min(PLAN_DAYS, daysBetween(state.plan.startDate, todayISO()) + 1));
  }

  function planCheckins() {
    if (!state.plan) return [];
    return state.checkins.filter(function (c) { return c.planId === state.plan.id; });
  }

  function lastCheckin() {
    var list = planCheckins();
    return list.length ? list[list.length - 1] : null;
  }

  function nextCheckinDue() {
    if (!state.plan) return null;
    var last = lastCheckin();
    var from = last ? last.date : state.plan.startDate;
    return addDays(from, state.settings.checkinDays || 7);
  }

  function logSince(dateISO) {
    return state.log.filter(function (e) { return !dateISO || e.date > dateISO; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }

  function commitmentById(id) {
    if (!state.plan) return null;
    return state.plan.commitments.filter(function (c) { return c.id === id; })[0] || null;
  }

  function commitmentLabel(id) {
    if (!state.plan) return '';
    var i = state.plan.commitments.map(function (c) { return c.id; }).indexOf(id);
    return i < 0 ? '' : 'Commitment ' + (i + 1);
  }

  function commitmentStats(cid) {
    var s = { kept: 0, mixed: 0, slipped: 0, logSlips: 0, logKept: 0 };
    planCheckins().forEach(function (c) { var r = c.ratings && c.ratings[cid]; if (r && s[r] != null) s[r]++; });
    state.log.forEach(function (e) {
      if (e.commitmentId !== cid) return;
      if (e.outcome === 'slipped') s.logSlips++;
      if (e.outcome === 'kept') s.logKept++;
    });
    return s;
  }

  function recommendedChapters() {
    var ids = state.prologue.breakingPoints || [];
    var rec = [], rest = [];
    C.chapters.forEach(function (c) { (ids.indexOf(c.breakingPoint) >= 0 ? rec : rest).push(c); });
    return { recommended: rec, others: rest };
  }

  function chapterSteps(id) {
    var s = chapterState(id);
    return [
      { key: 'story', label: 'Story', done: !!s.storyRead },
      { key: 'assessment', label: 'Self-Assessment', done: has(s.assessmentSummary) },
      { key: 'reflection', label: 'Reflection', done: has(s.reflectionSummary) },
      { key: 'plan', label: 'Action Plan', done: !!s.planSaved }
    ];
  }

  function chapterProgress(id) {
    var steps = chapterSteps(id);
    var done = steps.filter(function (s) { return s.done; }).length;
    var next = steps.filter(function (s) { return !s.done; })[0];
    return { done: done, total: steps.length, next: next ? next.key : 'plan', complete: done === steps.length };
  }

  function continueTarget() {
    if (!has(state.prologue.sentence)) return { href: '#/start', label: 'Start: The Letter' };
    var order = recommendedChapters();
    var all = order.recommended.concat(order.others);
    for (var i = 0; i < all.length; i++) {
      var p = chapterProgress(all[i].id);
      if (!p.complete) return { href: '#/chapter/' + all[i].id + '/' + p.next, label: 'Continue Chapter ' + all[i].id };
    }
    return { href: '#/chapters', label: 'Revisit a Chapter' };
  }

  /* ---------- Prompt builders ---------- */

  function section(title, body) { return '=== ' + title.toUpperCase() + ' ===\n' + body.trim() + '\n'; }

  function bpListText() {
    return C.breakingPoints.map(function (b, i) {
      return (i + 1) + '. ' + b.name + ' (' + b.leader + ', Chapter ' + b.chapter + '): ' + b.definition;
    }).join('\n');
  }

  function readerProfileText() {
    var p = state.prologue;
    var out = 'My breaking point sentence: ' + (has(p.sentence) ? p.sentence : '(not written yet)') + '\n';
    out += 'My matched breaking point(s): ' + (p.breakingPoints.length ? bpNames(p.breakingPoints) : '(not matched yet)');
    if (has(p.evidence)) out += '\nEvidence noted: ' + p.evidence;
    return out;
  }

  function planText(plan) {
    plan = plan || state.plan;
    if (!plan) return '(No active 90 day plan yet.)';
    var out = 'Started ' + plan.startDate + '. Today is day ' + planDay() + ' of ' + PLAN_DAYS + '.\n';
    plan.commitments.forEach(function (c, i) {
      out += '\nCommitment ' + (i + 1) + ': ' + orNone(c.what) +
        '\nMeasure: ' + orNone(c.measure) +
        '\nWho can tell me if I slip: ' + orNone(c.who) + '\n';
    });
    return out;
  }

  function logEntryText(e) {
    var lines = [e.date + ': ' + orNone(e.decided)];
    if (has(e.happening)) lines.push('What was happening: ' + e.happening);
    if (has(e.pushing)) lines.push('Who was pushing: ' + e.pushing);
    if (has(e.protecting)) lines.push('What I was protecting: ' + e.protecting);
    if (has(e.cost)) lines.push('Who paid the cost: ' + e.cost);
    if (e.commitmentId) lines.push('Related to: ' + (commitmentLabel(e.commitmentId) || 'an earlier commitment'));
    if (e.outcome) lines.push('I logged this as: ' + ({ kept: 'kept my commitment', slipped: 'a slip', unsure: 'not sure' }[e.outcome] || e.outcome));
    if (e.breakingPoint) lines.push('Breaking point I felt: ' + bpNames([e.breakingPoint]));
    if (has(e.notes)) lines.push('Notes: ' + e.notes);
    return lines.join('\n  ');
  }

  function logText(entries) {
    if (!entries.length) return '(No decisions logged in this period.)';
    return entries.map(function (e, i) { return (i + 1) + '. ' + logEntryText(e); }).join('\n\n');
  }

  function closing(task, block) {
    return section('Your task', task) + '\n' +
      'When we finish, end with this block exactly, filled in, so I can paste it back into my app:\n\n' + block.trim() +
      '\n\nBegin now with your first question.';
  }

  var PROMPTS = {
    prologue: function () {
      var p = state.prologue;
      var decisions = p.decisions.filter(function (d) {
        return C.prologue.decisionFields.some(function (f) { return has(d[f.key]); });
      });
      var dText = decisions.length ? decisions.map(function (d, i) {
        return 'Decision ' + (i + 1) + '\n' + C.prologue.decisionFields.map(function (f) {
          return f.label.replace(/\s*\(.*\)$/, '') + ' ' + orNone(d[f.key]);
        }).join('\n');
      }).join('\n\n') : '(I have not described any decisions yet.)';
      var rText = C.prologue.reflectionQuestions.map(function (q, i) {
        return 'Q' + (i + 1) + '. ' + q + '\nMy answer: ' + orNone(p.reflections['q' + i]);
      }).join('\n\n');

      return [
        C.coachInstructions, '',
        section('The book context: Prologue, The Letter', C.prologue.summary + '\n\nThe five breaking points:\n' + bpListText()),
        section('Decisions I regret', dText),
        section('My reflections', rText),
        closing(
          '1. Ask me at least two questions about these decisions before you give any assessment. One question at a time.\n' +
          '2. Find the pattern across my decisions. Tell me whether you see a single bad day (a rule) or a repeated pattern, and show the evidence in my own words.\n' +
          '3. Match the pattern to one or two of the five breaking points.\n' +
          '4. Help me write one sentence in the form "When ___, I ___." If my version flatters me, say so plainly and ask me to rewrite it until it is true.',
          'BREAKING POINT SENTENCE: When ..., I ...\n' +
          'MATCHED BREAKING POINTS: (one or two of: Comfort, Convenience, Misplaced trust, Fear of standing alone, Self-preservation)\n' +
          'EVIDENCE: (one or two lines from what I told you)'
        )
      ].join('\n');
    },

    assessment: function (id) {
      var c = chapter(id), s = chapterState(id);
      return [
        C.coachInstructions, '',
        section('About me', readerProfileText()),
        section('The book context: Chapter ' + c.id + ', ' + c.title, 'Leader: ' + c.leader + '\nBreaking point: ' + bp(c.breakingPoint).name + ': ' + bp(c.breakingPoint).definition + '\nStory: ' + c.summary + '\nFocus: ' + c.focus),
        section('My self-assessment', 'Where does my pattern look like ' + c.leader + '\'s?\n' + c.assessmentQuestion + '\n\nMy answer: ' + orNone(s.assessmentAnswer)),
        closing(
          '1. Ask me at least two questions before you give any assessment. One question at a time.\n' +
          '2. Compare my pattern with ' + c.leader + '\'s. Be specific about where it matches and where it does not.\n' +
          '3. Say whether what I describe is a single bad day or a repeated pattern, and point to the evidence.\n' +
          '4. If my answer protects me or stays vague, name that and ask again.',
          'SELF ASSESSMENT SUMMARY: (two or three sentences on where my pattern matches this leader)\n' +
          'RULE OR PATTERN: (which one, and why)\n' +
          'WHAT TO WATCH: (one specific situation where I am most likely to repeat it)'
        )
      ].join('\n');
    },

    reflection: function (id) {
      var c = chapter(id), s = chapterState(id);
      var qText = c.reflectionQuestions.map(function (q, i) {
        var a = s.reflectAnswers && s.reflectAnswers['q' + i];
        return 'Q' + (i + 1) + '. ' + q + (has(a) ? '\nMy first thoughts: ' + a : '');
      }).join('\n\n');
      return [
        C.coachInstructions, '',
        section('About me', readerProfileText()),
        section('The book context: Chapter ' + c.id + ', ' + c.title, 'Leader: ' + c.leader + '\nStory: ' + c.summary + '\nFocus: ' + c.focus +
          (has(s.assessmentSummary) ? '\n\nMy self-assessment summary from earlier:\n' + s.assessmentSummary : '')),
        section('Reflection questions', qText),
        closing(
          '1. Ask me these questions one at a time, in order. Wait for my answer before moving on.\n' +
          '2. After each answer, ask at least one harder follow up question that tests whether my answer is true or comfortable.\n' +
          '3. If I gave first thoughts above, use them as a starting point and push past them.\n' +
          '4. After the last question, tell me what you noticed across my answers.',
          'REFLECTION SUMMARY: (three or four sentences in my own words where possible)\n' +
          'WHAT I AVOIDED: (the question or part I answered least honestly, if any)\n' +
          'ONE THING TO CHANGE: (one sentence)'
        )
      ].join('\n');
    },

    plan: function (id) {
      var c = chapter(id), s = chapterState(id);
      var prior = '';
      if (has(s.assessmentSummary)) prior += 'Self-assessment summary:\n' + s.assessmentSummary + '\n\n';
      if (has(s.reflectionSummary)) prior += 'Reflection summary:\n' + s.reflectionSummary + '\n\n';
      return [
        C.coachInstructions, '',
        section('About me', readerProfileText()),
        section('The book context: Chapter ' + c.id + ', ' + c.title, 'Leader: ' + c.leader + '\nStory: ' + c.summary + '\nFocus: ' + c.focus + '\n\nThe book\'s action step: ' + c.actionStep),
        prior ? section('What I have worked through so far', prior) : '',
        section('My current 90 day plan', planText()),
        section('My recent decision log', logText(state.log.slice(-10))),
        closing(
          '1. Ask me at least two questions before you propose anything. One question at a time.\n' +
          '2. Help me build a 90 day plan with no more than ' + MAX_COMMITMENTS + ' commitments. If I already have a plan, help me decide what to keep, change or replace.\n' +
          '3. Each commitment must state what I will do differently, how I will measure it, and who can tell me if I slip (a role, not a name).\n' +
          '4. Push back on anything vague or anything I cannot measure. Push back if I take on too much.\n' +
          '5. Include the book\'s action step if it fits. I decide the final plan.',
          '90 DAY PLAN\n' +
          'COMMITMENT 1: (what I will do differently)\n' +
          'MEASURE: (how I will measure it)\n' +
          'WHO: (the role of the person who can tell me if I slip)\n\n' +
          'COMMITMENT 2: ...\nMEASURE: ...\nWHO: ...\n\n' +
          'COMMITMENT 3: ...\nMEASURE: ...\nWHO: ...\n\n' +
          '(Use fewer commitments if fewer are right.)'
        )
      ].join('\n');
    },

    checkin: function () {
      var d = state.checkinDraft || {};
      var last = lastCheckin();
      var since = last ? last.date : (state.plan ? state.plan.startDate : null);
      var entries = logSince(since && last ? since : null).filter(function (e) { return !state.plan || e.date >= state.plan.startDate; });
      var ratingWord = { kept: 'Kept', mixed: 'Mixed', slipped: 'Slipped' };

      var report = state.plan.commitments.map(function (c, i) {
        var r = d.ratings && d.ratings[c.id];
        var ev = d.evidence && d.evidence[c.id];
        return 'Commitment ' + (i + 1) + ': ' + c.what + '\nMy rating: ' + (r ? ratingWord[r] : '(not rated)') + '\nMy evidence: ' + orNone(ev);
      }).join('\n\n');
      report += '\n\nSlips I want to report: ' + orNone(d.slips) +
        '\nWhat went well: ' + orNone(d.wins) +
        '\nWhat was hardest: ' + orNone(d.hardest);

      var record = state.plan.commitments.map(function (c, i) {
        var slips = entries.filter(function (e) { return e.commitmentId === c.id && e.outcome === 'slipped'; }).length;
        var kept = entries.filter(function (e) { return e.commitmentId === c.id && e.outcome === 'kept'; }).length;
        var r = d.ratings && d.ratings[c.id];
        var line = 'Commitment ' + (i + 1) + ': ' + kept + ' logged as kept, ' + slips + ' logged as slips this period.';
        if (r === 'kept' && slips > 0) line += ' Note: I rated this Kept, but my log shows ' + slips + ' slip' + (slips > 1 ? 's' : '') + '.';
        return line;
      }).join('\n');

      var history = planCheckins().slice(-3).map(function (c) {
        return c.date + ': ' + state.plan.commitments.map(function (cm, i) {
          return 'C' + (i + 1) + ' ' + (ratingWord[c.ratings && c.ratings[cm.id]] || 'not rated');
        }).join(', ') + (has(c.coachReply) ? '\nCoach summary: ' + c.coachReply.trim() : '');
      }).join('\n\n');

      return [
        C.coachInstructions, '',
        section('About me', readerProfileText()),
        section('My 90 day plan', planText()),
        section('My account for this check-in', report),
        section('The record: decision log since my last check-in', logText(entries)),
        section('Record check (counted by my app)', record),
        history ? section('Previous check-ins', history) : '',
        closing(
          'This is my weekly check-in.\n' +
          '1. Ask me at least two questions before you give any assessment. One question at a time.\n' +
          '2. Compare my account with the record. If a slip appears in my log that I did not mention above, name it plainly. If I reported a slip honestly, coach me on it.\n' +
          '3. For each commitment, say whether you see a single slip or a pattern forming.\n' +
          '4. Push back on excuses. Ask what I chose to do instead.\n' +
          '5. Help me decide one specific focus for the coming week. I decide.',
          'CHECK IN SUMMARY: (two or three sentences)\n' +
          'PATTERN WATCH: (rule or pattern, per commitment)\n' +
          'NEXT WEEK FOCUS: (one specific action)'
        )
      ].join('\n');
    },

    pre: function () {
      var t = state.tools.pre;
      return [
        C.coachInstructions, '',
        section('About me', readerProfileText()),
        section('My 90 day plan', planText()),
        section('A decision I am about to make', 'What I am facing: ' + orNone(t.facing) + '\nWhere the pressure is coming from: ' + orNone(t.pressure) + '\nWhat I am tempted to do: ' + orNone(t.tempted) + '\nWhat I would be protecting: ' + orNone(t.protecting)),
        closing(
          'I have not made this decision yet.\n' +
          '1. Ask me at least two short questions, one at a time, to help me see whether my breaking point is driving this.\n' +
          '2. Tell me plainly if what I am tempted to do matches my pattern.\n' +
          '3. Help me name the choice that keeps my commitments. I decide.',
          'DECISION CHECK: (does this match my pattern, and how)\n' +
          'MY CHOICE: (what I decided to do)\n' +
          'WHO I WILL TELL: (a role, not a name)'
        )
      ].join('\n');
    },

    review: function () {
      var cks = planCheckins();
      var ratingWord = { kept: 'Kept', mixed: 'Mixed', slipped: 'Slipped' };
      var stats = state.plan ? state.plan.commitments.map(function (c, i) {
        var s = commitmentStats(c.id);
        return 'Commitment ' + (i + 1) + ': check-ins rated ' + s.kept + ' kept, ' + s.mixed + ' mixed, ' + s.slipped + ' slipped. Log shows ' + s.logKept + ' kept and ' + s.logSlips + ' slips.';
      }).join('\n') : '';
      var history = cks.map(function (c) {
        return c.date + ': ' + state.plan.commitments.map(function (cm, i) {
          return 'C' + (i + 1) + ' ' + (ratingWord[c.ratings && c.ratings[cm.id]] || 'not rated');
        }).join(', ') + (has(c.coachReply) ? '\nCoach summary: ' + c.coachReply.trim() : '');
      }).join('\n\n');
      var entries = state.plan ? state.log.filter(function (e) { return e.date >= state.plan.startDate; }) : state.log;
      return [
        C.coachInstructions, '',
        section('About me', readerProfileText()),
        section('My 90 day plan', planText()),
        section('Totals counted by my app', stats || '(No plan yet.)'),
        section('Check-in history', history || '(No check-ins yet.)'),
        section('Full decision log for this plan', logText(entries)),
        closing(
          'This is my plan review (at day 30, 60 or 90).\n' +
          '1. Ask me at least two questions before you give any assessment. One question at a time.\n' +
          '2. Compare what I claim about my progress with the record above. Say plainly where they differ.\n' +
          '3. For each commitment, tell me whether the pattern is changing, holding or returning, with evidence.\n' +
          '4. Ask whether my breaking point sentence is still true, or whether it needs to be rewritten.\n' +
          '5. Help me decide what to keep, change or drop for the next period. I decide.',
          'PLAN REVIEW: (three or four sentences)\n' +
          'KEEP: ...\nCHANGE: ...\nDROP: ...\n' +
          'BREAKING POINT SENTENCE STILL TRUE: (yes, or the rewritten sentence)'
        )
      ].join('\n');
    }
  };

  function buildPrompt(kind, arg) {
    return PROMPTS[kind](arg).replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  function promptCard(kind, arg, opts) {
    opts = opts || {};
    return '<div class="prompt-card">' +
      '<h3>Your coaching prompt</h3>' +
      '<ol class="howto">' +
        '<li>Tap <strong>Copy prompt</strong>. It includes the coach instructions, the story and your answers.</li>' +
        '<li>Tap <strong>Open Claude</strong> and paste it into a new chat in your own free account.</li>' +
        '<li>Have the conversation there. When you finish, copy the coach\'s final block and paste it below.</li>' +
      '</ol>' +
      (opts.warn ? '<p class="note">' + esc(opts.warn) + '</p>' : '') +
      '<div class="btn-row">' +
        '<button class="btn primary" data-action="copy-prompt" data-kind="' + kind + '" data-arg="' + esc(arg == null ? '' : arg) + '">Copy prompt</button>' +
        '<a class="btn" href="' + CLAUDE_URL + '" target="_blank" rel="noopener">Open Claude</a>' +
        '<button class="btn ghost" data-action="preview-prompt" data-kind="' + kind + '" data-arg="' + esc(arg == null ? '' : arg) + '">Preview</button>' +
      '</div>' +
      '<textarea class="prompt-preview" readonly hidden aria-label="Prompt preview"></textarea>' +
    '</div>';
  }

  /* ---------- Paste back parsing ---------- */

  function cleanLine(s) {
    return s.replace(/\*\*|__|`/g, '')
      .replace(/^\s*(?:[-*•>#]+\s*|\d+[.)]\s+)/, '')
      .trim();
  }

  function parseFields(text) {
    var out = {}, lastKey = null;
    String(text || '').split(/\r?\n/).forEach(function (raw) {
      var line = cleanLine(raw);
      var m = line.match(/^([A-Za-z][A-Za-z0-9 ]{1,40}?)\s*:\s*(.*)$/);
      if (m && m[1] === m[1].toUpperCase()) {
        lastKey = m[1].trim().replace(/\s+/g, ' ');
        out[lastKey] = m[2].trim();
      } else if (lastKey && line && !/^[A-Z0-9 ]+$/.test(line)) {
        out[lastKey] = (out[lastKey] ? out[lastKey] + ' ' : '') + line;
      } else if (!line) {
        lastKey = null;
      }
    });
    return out;
  }

  function parseBreakingPoints(text) {
    var t = String(text || '').toLowerCase();
    var found = [];
    var aliases = {
      comfort: ['comfort'],
      convenience: ['convenience'],
      trust: ['misplaced trust', 'trust'],
      standing: ['fear of standing alone', 'standing alone'],
      self: ['self-preservation', 'self preservation', 'selfpreservation']
    };
    Object.keys(aliases).forEach(function (id) {
      if (aliases[id].some(function (a) { return t.indexOf(a) >= 0; })) found.push(id);
    });
    return found;
  }

  function parsePlan(text) {
    var out = [], cur = null;
    String(text || '').split(/\r?\n/).forEach(function (raw) {
      var line = cleanLine(raw), m;
      if ((m = line.match(/^commitment\s*\d*\s*[:.)—]\s*(.+)$/i))) {
        cur = { what: m[1].trim(), measure: '', who: '' };
        out.push(cur);
      } else if (cur && (m = line.match(/^(?:how i will\s+)?measure[a-z ]*:\s*(.+)$/i))) {
        cur.measure = m[1].trim();
      } else if (cur && (m = line.match(/^who[^:]*:\s*(.+)$/i))) {
        cur.who = m[1].trim();
      } else if (cur && line && !/^(90 day plan|commitment)/i.test(line) && !cur.measure && !cur.who) {
        cur.what += ' ' + line;
      }
    });
    return out.slice(0, MAX_COMMITMENTS);
  }

  /* ---------- Views ---------- */

  function stepper(steps, current, hrefFor) {
    return '<ol class="stepper">' + steps.map(function (s, i) {
      var cls = (s.key === current ? 'current ' : '') + (s.done ? 'done' : '');
      return '<li class="' + cls + '"><a href="' + hrefFor(s.key) + '"' + (s.key === current ? ' aria-current="step"' : '') + '>' +
        '<span class="num">' + (s.done ? '&#10003;' : (i + 1)) + '</span><span class="lbl">' + esc(s.label) + '</span></a></li>';
    }).join('') + '</ol>';
  }

  function pageHead(kicker, title, sub) {
    return '<header class="page-head">' + (kicker ? '<p class="kicker">' + esc(kicker) + '</p>' : '') +
      '<h1>' + esc(title) + '</h1>' + (sub ? '<p class="lede">' + esc(sub) + '</p>' : '') + '</header>';
  }

  function sentenceBanner() {
    var p = state.prologue;
    if (!has(p.sentence)) return '';
    return '<section class="pinned" aria-label="My breaking point">' +
      '<p class="kicker">My breaking point</p>' +
      '<blockquote>' + esc(p.sentence) + '</blockquote>' +
      (p.breakingPoints.length ? '<p class="tags">' + p.breakingPoints.map(function (id) {
        var b = bp(id); return b ? '<a class="tag" href="#/chapter/' + b.chapter + '">' + esc(b.name) + '</a>' : '';
      }).join('') + '</p>' : '') +
    '</section>';
  }

  /* Home */
  function viewHome() {
    var cont = continueTarget();
    var html = '';
    html += sentenceBanner();

    if (!has(state.prologue.sentence)) {
      html += '<section class="card hero">' +
        '<p class="kicker">A free companion to ' + esc(C.book.title) + ' by ' + esc(C.book.author) + '</p>' +
        '<h1>Find your breaking point. Build a 90 day plan. Keep it.</h1>' +
        '<p>Work through the book chapter by chapter with an accountability coach. This app writes each coaching prompt for you. You paste it into your own free Claude account, have the conversation, and bring the result back here.</p>' +
        '<p class="small muted">No account. No payment. Everything stays private on this device.</p>' +
        '<div class="btn-row"><a class="btn primary" href="#/start">Start: The Letter</a></div>' +
      '</section>';
    }

    // Plan
    html += '<section class="card"><div class="card-head"><h2>My 90 day plan</h2>' +
      (state.plan ? '<a class="link" href="#/plan">Edit</a>' : '') + '</div>';
    if (state.plan) {
      var day = planDay();
      html += '<div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="' + PLAN_DAYS + '" aria-valuenow="' + day + '"><span style="width:' + Math.round(day / PLAN_DAYS * 100) + '%"></span></div>' +
        '<p class="small muted">Day ' + day + ' of ' + PLAN_DAYS + ' &middot; ends ' + esc(fmtDate(addDays(state.plan.startDate, PLAN_DAYS - 1))) + '</p>';
      html += '<ol class="commitments">' + state.plan.commitments.map(function (c) {
        var s = commitmentStats(c.id);
        return '<li><p class="what">' + esc(c.what) + '</p>' +
          '<p class="meta"><span>Measure:</span> ' + esc(c.measure || 'not set') + '</p>' +
          '<p class="meta"><span>Who can tell me if I slip:</span> ' + esc(c.who || 'not set') + '</p>' +
          '<p class="stats"><span class="pill kept">' + s.kept + ' kept</span><span class="pill mixed">' + s.mixed + ' mixed</span><span class="pill slipped">' + s.slipped + ' slipped</span>' +
          (s.logSlips ? '<span class="pill log">' + s.logSlips + ' logged slip' + (s.logSlips > 1 ? 's' : '') + '</span>' : '') + '</p></li>';
      }).join('') + '</ol>';
    } else {
      html += '<p class="muted">No plan yet. You build it in the Action Plan step of any chapter, with up to ' + MAX_COMMITMENTS + ' commitments.</p>';
    }
    html += '</section>';

    // Check-in due
    var due = nextCheckinDue();
    if (due) {
      var diff = daysBetween(todayISO(), due);
      var cls = diff < 0 ? 'overdue' : diff === 0 ? 'today' : '';
      var when = diff < 0 ? 'Overdue by ' + (-diff) + ' day' + (diff === -1 ? '' : 's') : diff === 0 ? 'Due today' : 'In ' + diff + ' day' + (diff === 1 ? '' : 's');
      html += '<section class="card due ' + cls + '"><div><p class="kicker">Next check-in</p><p class="due-date">' + esc(fmtDate(due)) + '</p><p class="small">' + when + '</p></div>' +
        '<a class="btn' + (diff <= 0 ? ' primary' : '') + '" href="#/checkin">Check in</a></section>';
    }

    // Actions
    html += '<section class="actions">' +
      '<a class="action primary" href="' + cont.href + '"><strong>' + esc(cont.label) + '</strong><span>Pick up where you left off</span></a>' +
      '<a class="action" href="#/log/new"><strong>Log a Decision</strong><span>Build the record your coach checks</span></a>' +
      '<a class="action" href="#/checkin"><strong>Weekly Check-In</strong><span>Report, compare, adjust</span></a>' +
      '<a class="action" href="#/tools"><strong>Tools</strong><span>Prompts, backup, PDF</span></a>' +
    '</section>';

    // Recent log
    if (state.log.length) {
      var recent = state.log.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3);
      html += '<section class="card"><div class="card-head"><h2>Recent decisions</h2><a class="link" href="#/log">See all</a></div>' +
        recent.map(logItem).join('') + '</section>';
    }
    return html;
  }

  /* Prologue */
  var PRO_STEPS = [
    { key: 'story', label: 'Story' },
    { key: 'decisions', label: 'Decisions' },
    { key: 'reflect', label: 'Reflect' },
    { key: 'coach', label: 'Coach' },
    { key: 'save', label: 'Save' }
  ];

  function prologueSteps() {
    var p = state.prologue;
    var anyDecision = p.decisions.some(function (d) { return has(d.decided); });
    var anyReflect = C.prologue.reflectionQuestions.some(function (q, i) { return has(p.reflections['q' + i]); });
    return PRO_STEPS.map(function (s) {
      var done = { story: p.storyRead, decisions: anyDecision, reflect: anyReflect, coach: has(p.coachReply) || has(p.sentence), save: has(p.sentence) }[s.key];
      return { key: s.key, label: s.label, done: !!done };
    });
  }

  function nextLink(href, label) {
    return '<div class="btn-row end"><a class="btn primary" href="' + href + '">' + esc(label) + '</a></div>';
  }

  function viewPrologue(step) {
    step = step || 'story';
    var p = state.prologue, P = C.prologue;
    var html = pageHead('Start here: ' + P.label, P.title, 'Find your pattern and write your breaking point in one sentence.');
    html += stepper(prologueSteps(), step, function (k) { return '#/start/' + k; });

    if (step === 'story') {
      html += '<section class="card story"><p class="kicker">' + esc(P.leader) + '</p><p class="story-text">' + esc(P.summary) + '</p></section>';
      html += '<section class="card"><h2>The five breaking points</h2>' + bpReference() + '</section>';
      html += '<div class="btn-row end"><button class="btn primary" data-action="prologue-read">I have read this. Next</button></div>';
    }

    if (step === 'decisions') {
      html += '<section class="card"><h2>Decisions you regret</h2><p>Describe up to ' + MAX_REGRETS + ' leadership decisions you regret. Be specific about the week, the pressure and the cost. Describe people by role, never by name.</p></section>';
      p.decisions.forEach(function (d, i) {
        html += '<section class="card"><div class="card-head"><h3>Decision ' + (i + 1) + '</h3>' +
          (p.decisions.length > 1 ? '<button class="link danger" data-action="remove-regret" data-index="' + i + '">Remove</button>' : '') + '</div>' +
          P.decisionFields.map(function (f) { return field(f.label, 'prologue.decisions.' + i + '.' + f.key, { rows: 2 }); }).join('') +
        '</section>';
      });
      if (p.decisions.length < MAX_REGRETS) html += '<div class="btn-row"><button class="btn" data-action="add-regret">Add another decision</button></div>';
      html += nextLink('#/start/reflect', 'Next: Reflect');
    }

    if (step === 'reflect') {
      html += '<section class="card"><h2>Reflection</h2><p>Answer honestly. Short answers are fine. Your answers go into your coaching prompt.</p>' +
        P.reflectionQuestions.map(function (q, i) { return field(q, 'prologue.reflections.q' + i, { rows: 3 }); }).join('') + '</section>';
      html += nextLink('#/start/coach', 'Next: Coach');
    }

    if (step === 'coach') {
      var any = p.decisions.some(function (d) { return has(d.decided); });
      html += '<section class="card"><h2>Find the pattern with your coach</h2><p>Your coach will ask questions, find the pattern across your decisions, match it to the five breaking points and help you write one sentence: <em>"When ___, I ___."</em> It will flag any version that flatters you.</p></section>';
      html += promptCard('prologue', '', { warn: any ? '' : 'You have not described any decisions yet. The coach works best with at least one.' });
      html += '<section class="card"><h3>Paste the coach\'s final block</h3>' +
        field('Coach\'s final block', 'prologue.coachReply', { rows: 6, placeholder: 'BREAKING POINT SENTENCE: When ..., I ...\nMATCHED BREAKING POINTS: ...\nEVIDENCE: ...' }) +
        '<div class="btn-row"><button class="btn primary" data-action="parse-prologue">Read it and continue</button></div></section>';
    }

    if (step === 'save') {
      html += '<section class="card"><h2>Your breaking point</h2><p>Check that this is true, not flattering. Edit it if you need to. It will be pinned to your home screen.</p>' +
        field('My breaking point sentence', 'prologue.sentence', { rows: 2, placeholder: 'When ___, I ___.' }) +
        '<fieldset class="field"><legend>Matched breaking point(s)</legend><div class="checks">' +
        C.breakingPoints.map(function (b) {
          var on = p.breakingPoints.indexOf(b.id) >= 0;
          return '<label class="check"><input type="checkbox" data-action="toggle-bp" value="' + b.id + '"' + (on ? ' checked' : '') + '><span><strong>' + esc(b.name) + '</strong> <span class="muted">' + esc(b.leader) + ', Chapter ' + b.chapter + '</span></span></label>';
        }).join('') + '</div></fieldset>' +
        field('Evidence (optional)', 'prologue.evidence', { rows: 2 }) +
        '<div class="btn-row"><button class="btn primary" data-action="save-sentence">Save and pin it</button></div></section>';
    }
    return html;
  }

  function bpReference() {
    return '<ol class="bp-list">' + C.breakingPoints.map(function (b) {
      return '<li><strong>' + esc(b.name) + '</strong> <span class="muted">(' + esc(b.leader) + ', Chapter ' + b.chapter + ')</span><br>' + esc(b.definition) + '</li>';
    }).join('') + '</ol>';
  }

  /* Chapters list */
  function chapterCard(c, recommended) {
    var p = chapterProgress(c.id);
    var b = bp(c.breakingPoint);
    return '<a class="chapter-card' + (recommended ? ' rec' : '') + '" href="#/chapter/' + c.id + '/' + (p.complete ? 'story' : p.next) + '">' +
      '<div class="ch-num">' + c.id + '</div>' +
      '<div class="ch-body">' + (recommended ? '<span class="badge">Recommended for you</span>' : '') +
        '<h3>' + esc(c.title) + '</h3><p class="muted small">' + esc(c.leader) + ' &middot; ' + esc(b.name) + '</p>' +
        '<p class="small">' + esc(c.focus) + '</p>' +
        '<div class="dots" aria-label="' + p.done + ' of ' + p.total + ' steps done">' + chapterSteps(c.id).map(function (s) { return '<span class="' + (s.done ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
      '</div></a>';
  }

  function viewChapters() {
    var order = recommendedChapters();
    var html = pageHead('Chapter modules', 'Chapters', 'Each chapter has four steps: Story, Self-Assessment, Reflection and Action Plan.');
    html += '<a class="chapter-card prologue-card" href="#/start"><div class="ch-num">P</div><div class="ch-body"><h3>The Letter</h3><p class="muted small">Prologue &middot; Calvin Brooks</p><p class="small">' +
      (has(state.prologue.sentence) ? 'Done. Revisit to rewrite your sentence.' : 'Start here to find your breaking point.') + '</p></div></a>';
    if (order.recommended.length) {
      html += '<h2 class="section-title">Matched to your breaking point</h2>' + order.recommended.map(function (c) { return chapterCard(c, true); }).join('');
      html += '<h2 class="section-title">Other chapters</h2>';
    }
    html += order.others.map(function (c) { return chapterCard(c, false); }).join('');
    return html;
  }

  /* Chapter module */
  function viewChapter(id, step) {
    var c = chapter(id);
    if (!c) return viewNotFound();
    step = step || chapterProgress(id).next;
    var s = chapterState(id);
    var b = bp(c.breakingPoint);
    var rec = state.prologue.breakingPoints.indexOf(c.breakingPoint) >= 0;
    var html = pageHead('Chapter ' + c.id + ' · ' + b.name + (rec ? ' · Recommended for you' : ''), c.title, c.leader);
    html += stepper(chapterSteps(id), step, function (k) { return '#/chapter/' + id + '/' + k; });
    var draft = c.placeholder ? '<p class="note small">Draft content. The exact questions and action step from the book will appear here soon.</p>' : '';

    if (step === 'story') {
      html += '<section class="card story"><p class="kicker">' + esc(c.leader) + '</p><p class="story-text">' + esc(c.summary) + '</p>' +
        '<p><strong>Breaking point:</strong> ' + esc(b.name) + '. ' + esc(b.definition) + '</p>' +
        '<p><strong>Focus:</strong> ' + esc(c.focus) + '</p></section>';
      html += '<section class="card"><h3>The book\'s action step</h3><p>' + esc(c.actionStep) + '</p>' + draft + '</section>';
      html += '<div class="btn-row end"><button class="btn primary" data-action="chapter-read" data-id="' + id + '">I have read this. Next</button></div>';
    }

    if (step === 'assessment') {
      html += '<section class="card"><h2>Where does my pattern look like ' + esc(c.leader) + '\'s?</h2><p>' + esc(c.assessmentQuestion) + '</p>' + draft +
        field('My answer', 'chapters.' + id + '.assessmentAnswer', { rows: 4 }) + '</section>';
      html += promptCard('assessment', id);
      html += '<section class="card"><h3>Paste the coach\'s summary</h3>' +
        field('Coach\'s final block', 'chapters.' + id + '.assessmentSummary', { rows: 5, placeholder: 'SELF ASSESSMENT SUMMARY: ...' }) +
        '<div class="btn-row"><button class="btn primary" data-action="chapter-step-save" data-id="' + id + '" data-field="assessmentSummary" data-next="reflection">Save and continue</button></div></section>';
    }

    if (step === 'reflection') {
      html += '<section class="card"><h2>Reflection</h2><p>Your coach will ask these one at a time, with at least one harder follow up for each. First thoughts are optional; if you write them, they go into the prompt.</p>' + draft +
        c.reflectionQuestions.map(function (q, i) { return field(q, 'chapters.' + id + '.reflectAnswers.q' + i, { rows: 2, placeholder: 'First thoughts (optional)' }); }).join('') + '</section>';
      html += promptCard('reflection', id);
      html += '<section class="card"><h3>Paste the coach\'s summary</h3>' +
        field('Coach\'s final block', 'chapters.' + id + '.reflectionSummary', { rows: 5, placeholder: 'REFLECTION SUMMARY: ...' }) +
        '<div class="btn-row"><button class="btn primary" data-action="chapter-step-save" data-id="' + id + '" data-field="reflectionSummary" data-next="plan">Save and continue</button></div></section>';
    }

    if (step === 'plan') {
      html += '<section class="card"><h2>Action plan</h2><p>Build a 90 day plan with no more than ' + MAX_COMMITMENTS + ' commitments. Each one states what you will do differently, how you will measure it, and who can tell you if you slip.</p>' +
        '<div class="callout"><p class="kicker">The book\'s action step</p><p>' + esc(c.actionStep) + '</p></div>' + draft +
        (state.plan ? '<p class="small muted">You have an active plan (day ' + planDay() + '). The coach will see it and help you decide what to keep or change.</p>' : '') + '</section>';
      html += promptCard('plan', id);
      html += '<section class="card"><h3>Paste the coach\'s plan</h3>' +
        field('Coach\'s 90 day plan', 'chapters.' + id + '.planText', { rows: 8, placeholder: '90 DAY PLAN\nCOMMITMENT 1: ...\nMEASURE: ...\nWHO: ...' }) +
        '<div class="btn-row"><button class="btn" data-action="parse-plan" data-id="' + id + '">Read my plan</button></div>';
      if (s.planDraft) html += planEditor('chapters.' + id + '.planDraft', s.planDraft) +
        '<div class="btn-row"><button class="btn primary" data-action="activate-plan" data-id="' + id + '">' + (state.plan ? 'Replace my active plan with this' : 'Make this my 90 day plan') + '</button></div>';
      html += '</section>';
      if (s.planSaved) html += '<p class="note">This chapter\'s plan is saved. <a href="#/home">See it on Home</a>.</p>';
    }
    return html;
  }

  function planEditor(basePath, commitments) {
    var html = '<div class="plan-editor">';
    commitments.forEach(function (c, i) {
      html += '<fieldset class="commit-edit"><legend>Commitment ' + (i + 1) + '</legend>' +
        field('What I will do differently', basePath + '.' + i + '.what', { rows: 2 }) +
        field('How I will measure it', basePath + '.' + i + '.measure', { rows: 2 }) +
        field('Who can tell me if I slip (a role, not a name)', basePath + '.' + i + '.who', { type: 'text' }) +
        '<button class="link danger" data-action="remove-commitment" data-path="' + esc(basePath) + '" data-index="' + i + '">Remove this commitment</button>' +
      '</fieldset>';
    });
    if (commitments.length < MAX_COMMITMENTS) html += '<button class="btn" data-action="add-commitment" data-path="' + esc(basePath) + '">Add a commitment</button>';
    return html + '</div>';
  }

  /* Plan editor page */
  function viewPlan() {
    var html = pageHead('90 day plan', 'My plan', 'Edit your commitments or start date. Up to ' + MAX_COMMITMENTS + ' commitments.');
    if (!state.plan) {
      html += '<section class="card"><p>No active plan. Build one in the Action Plan step of a chapter, or start a blank one.</p>' +
        '<div class="btn-row"><a class="btn primary" href="' + continueTarget().href + '">' + esc(continueTarget().label) + '</a><button class="btn" data-action="blank-plan">Start a blank plan</button></div></section>';
    } else {
      html += '<section class="card">' + field('Start date', 'plan.startDate', { type: 'date' }) +
        '<p class="small muted">Ends ' + esc(fmtDate(addDays(state.plan.startDate, PLAN_DAYS - 1))) + '.' + (state.plan.sourceChapter ? ' Built in Chapter ' + state.plan.sourceChapter + '.' : '') + '</p>' +
        planEditor('plan.commitments', state.plan.commitments) + '</section>' +
        '<div class="btn-row end"><button class="btn" data-action="end-plan">End this plan</button><a class="btn primary" href="#/home">Done</a></div>';
    }
    if (state.pastPlans.length) {
      html += '<section class="card"><h2>Past plans</h2>' + state.pastPlans.slice().reverse().map(function (p) {
        return '<div class="past-plan"><p class="small muted">' + esc(fmtDate(p.startDate)) + ' to ' + esc(fmtDate(p.endedAt || addDays(p.startDate, PLAN_DAYS - 1))) + '</p><ol>' +
          p.commitments.map(function (c) { return '<li>' + esc(c.what) + '</li>'; }).join('') + '</ol></div>';
      }).join('') + '</section>';
    }
    return html;
  }

  /* Decision log */
  function logItem(e) {
    var outcome = e.outcome ? '<span class="pill ' + esc(e.outcome) + '">' + esc({ kept: 'Kept', slipped: 'Slip', unsure: 'Unsure' }[e.outcome]) + '</span>' : '';
    var rel = e.commitmentId ? '<span class="pill">' + esc(commitmentLabel(e.commitmentId) || 'Past commitment') + '</span>' : '';
    return '<a class="log-item" href="#/log/edit/' + e.id + '"><p class="small muted">' + esc(fmtDate(e.date)) + '</p>' +
      '<p class="what">' + esc(e.decided || '(no description)') + '</p><p class="stats">' + outcome + rel +
      (e.breakingPoint ? '<span class="pill">' + esc(bpNames([e.breakingPoint])) + '</span>' : '') + '</p></a>';
  }

  function viewLog() {
    var html = pageHead('The record', 'Decision log', 'Your coach checks your claims against this log. Log the hard calls, the wins and the slips.');
    html += '<div class="btn-row"><a class="btn primary" href="#/log/new">Log a decision</a></div>';
    if (!state.log.length) {
      html += '<section class="card"><p class="muted">Nothing logged yet. Log a decision whenever pressure shows up: what you decided, what was happening, and whether you kept your commitment.</p></section>';
    } else {
      html += '<section class="card list">' + state.log.slice().sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); }).map(logItem).join('') + '</section>';
    }
    return html;
  }

  var logDraft = null;
  function viewLogForm(id) {
    var editing = !!id;
    if (editing) {
      var e = state.log.filter(function (x) { return x.id === id; })[0];
      if (!e) return viewNotFound();
      logDraft = JSON.parse(JSON.stringify(e));
    } else if (!logDraft || logDraft.id) {
      logDraft = { id: null, date: todayISO(), decided: '', happening: '', pushing: '', protecting: '', cost: '', commitmentId: '', outcome: '', breakingPoint: '', notes: '' };
    }
    var d = logDraft;
    var html = pageHead('Decision log', editing ? 'Edit decision' : 'Log a decision', 'Describe people by role, never by name.');
    html += '<section class="card">' +
      draftField('Date', 'date', { type: 'date' }) +
      draftField('What did I decide?', 'decided', { rows: 2 }) +
      draftField('What was happening?', 'happening', { rows: 2 }) +
      draftField('Who was pushing? (roles)', 'pushing', { type: 'text' }) +
      draftField('What was I protecting?', 'protecting', { type: 'text' }) +
      draftField('Who paid the cost? (roles)', 'cost', { type: 'text' });

    if (state.plan) {
      html += '<div class="field"><label for="ld_commit">Which commitment does this relate to?</label><select id="ld_commit" data-draft="commitmentId"><option value="">None</option>' +
        state.plan.commitments.map(function (c, i) { return '<option value="' + c.id + '"' + (d.commitmentId === c.id ? ' selected' : '') + '>Commitment ' + (i + 1) + ': ' + esc(c.what.slice(0, 60)) + '</option>'; }).join('') +
        (d.commitmentId && !commitmentById(d.commitmentId) ? '<option value="' + esc(d.commitmentId) + '" selected>A past commitment</option>' : '') +
        '</select></div>';
    }
    html += '<fieldset class="field"><legend>Did I keep my commitment?</legend><div class="seg">' +
      [['kept', 'Kept it'], ['slipped', 'Slipped'], ['unsure', 'Not sure'], ['', 'Not related']].map(function (o) {
        return '<label><input type="radio" name="ld_outcome" data-draft="outcome" value="' + o[0] + '"' + (d.outcome === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
      }).join('') + '</div></fieldset>';
    html += '<div class="field"><label for="ld_bp">Breaking point I felt (optional)</label><select id="ld_bp" data-draft="breakingPoint"><option value="">None or not sure</option>' +
      C.breakingPoints.map(function (b) { return '<option value="' + b.id + '"' + (d.breakingPoint === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select></div>';
    html += draftField('Notes (optional)', 'notes', { rows: 2 });
    html += '</section><div class="btn-row end">' +
      (editing ? '<button class="btn danger" data-action="delete-log" data-id="' + id + '">Delete</button>' : '') +
      '<a class="btn" href="#/log">Cancel</a><button class="btn primary" data-action="save-log">Save</button></div>';
    return html;
  }

  function draftField(label, key, opts) {
    opts = opts || {};
    var id = 'ld_' + key, v = logDraft[key] || '';
    var input = opts.type === 'date' ? '<input type="date" id="' + id + '" data-draft="' + key + '" value="' + esc(v) + '">'
      : opts.type === 'text' ? '<input type="text" id="' + id + '" data-draft="' + key + '" value="' + esc(v) + '">'
      : '<textarea id="' + id + '" data-draft="' + key + '" rows="' + (opts.rows || 2) + '">' + esc(v) + '</textarea>';
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + input + '</div>';
  }

  /* Weekly check-in */
  function viewCheckin(step) {
    var html = pageHead('Weekly check-in', 'Check-In', 'Give your own account first. Then your coach compares it with the record.');
    if (!state.plan) {
      return html + '<section class="card"><p>You need a 90 day plan before you can check in on it. Build one in the Action Plan step of a chapter.</p>' +
        '<div class="btn-row"><a class="btn primary" href="' + continueTarget().href + '">' + esc(continueTarget().label) + '</a></div></section>' + checkinHistory();
    }
    if (!state.checkinDraft || state.checkinDraft.planId !== state.plan.id) {
      state.checkinDraft = { planId: state.plan.id, date: todayISO(), ratings: {}, evidence: {}, slips: '', wins: '', hardest: '', coachReply: '' };
    }
    var d = state.checkinDraft;
    step = step || 'report';
    var steps = [
      { key: 'report', label: 'My account', done: state.plan.commitments.every(function (c) { return d.ratings[c.id]; }) },
      { key: 'coach', label: 'Coach', done: has(d.coachReply) },
      { key: 'history', label: 'History', done: false }
    ];
    html += stepper(steps, step, function (k) { return '#/checkin/' + k; });

    if (step === 'report') {
      var last = lastCheckin();
      var since = last ? last.date : state.plan.startDate;
      var entries = state.log.filter(function (e) { return last ? e.date > since : e.date >= since; });
      html += '<p class="small muted">Since ' + esc(fmtDate(since)) + ': ' + entries.length + ' decision' + (entries.length === 1 ? '' : 's') + ' logged. Your coach will see all of them.</p>';
      state.plan.commitments.forEach(function (c, i) {
        var r = d.ratings[c.id] || '';
        html += '<section class="card"><p class="kicker">Commitment ' + (i + 1) + '</p><p class="what">' + esc(c.what) + '</p>' +
          '<p class="small muted">Measure: ' + esc(c.measure || 'not set') + '</p>' +
          '<fieldset class="field"><legend>This week I</legend><div class="seg">' +
          [['kept', 'Kept it'], ['mixed', 'Mixed'], ['slipped', 'Slipped']].map(function (o) {
            return '<label><input type="radio" name="r_' + c.id + '" data-action="rate" data-cid="' + c.id + '" value="' + o[0] + '"' + (r === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
          }).join('') + '</div></fieldset>' +
          field('My evidence (what happened, by the measure)', 'checkinDraft.evidence.' + c.id, { rows: 2 }) + '</section>';
      });
      html += '<section class="card">' +
        field('Slips I want to report', 'checkinDraft.slips', { rows: 2, hint: 'A slip you report gets a coaching conversation. One slip is not failure.' }) +
        field('What went well', 'checkinDraft.wins', { rows: 2 }) +
        field('What was hardest', 'checkinDraft.hardest', { rows: 2 }) + '</section>';
      html += nextLink('#/checkin/coach', 'Next: Coach');
    }

    if (step === 'coach') {
      var unrated = state.plan.commitments.filter(function (c) { return !d.ratings[c.id]; }).length;
      html += promptCard('checkin', '', { warn: unrated ? 'You have not rated ' + unrated + ' commitment' + (unrated > 1 ? 's' : '') + ' yet.' : '' });
      html += '<section class="card"><h3>Paste the coach\'s summary</h3>' +
        field('Coach\'s final block', 'checkinDraft.coachReply', { rows: 6, placeholder: 'CHECK IN SUMMARY: ...\nPATTERN WATCH: ...\nNEXT WEEK FOCUS: ...' }) +
        '<div class="btn-row"><button class="btn primary" data-action="save-checkin">Save check-in</button></div></section>';
    }

    if (step === 'history') html += checkinHistory();
    return html;
  }

  function checkinHistory() {
    if (!state.checkins.length) return '<section class="card"><p class="muted">No check-ins yet.</p></section>';
    var ratingWord = { kept: 'Kept', mixed: 'Mixed', slipped: 'Slipped' };
    return '<section class="card list"><h2>Check-in history</h2>' + state.checkins.slice().reverse().map(function (c) {
      var plan = (state.plan && state.plan.id === c.planId) ? state.plan : state.pastPlans.filter(function (p) { return p.id === c.planId; })[0];
      var ratings = plan ? plan.commitments.map(function (cm, i) {
        var r = c.ratings && c.ratings[cm.id];
        return r ? '<span class="pill ' + r + '">C' + (i + 1) + ' ' + ratingWord[r] + '</span>' : '';
      }).join('') : '';
      var fields = parseFields(c.coachReply);
      var focus = fields['NEXT WEEK FOCUS'];
      return '<details class="history-item"><summary><span>' + esc(fmtDate(c.date)) + '</span><span class="stats">' + ratings + '</span></summary>' +
        (focus ? '<p><strong>Next week focus:</strong> ' + esc(focus) + '</p>' : '') +
        (has(c.coachReply) ? '<div class="reply">' + nl2br(c.coachReply) + '</div>' : '') +
        (has(c.slips) ? '<p class="small"><strong>Slips I reported:</strong> ' + esc(c.slips) + '</p>' : '') +
        '<button class="link danger" data-action="delete-checkin" data-id="' + c.id + '">Delete this check-in</button>' +
      '</details>';
    }).join('') + '</section>';
  }

  /* Tools */
  function viewTools() {
    var html = pageHead('Tools', 'Tools', 'Extra coaching prompts, your data and the reference guide.');
    html += '<section class="card"><h2>Before a hard decision</h2><p>Pressure building? Check whether your breaking point is driving the call before you make it.</p>' +
      field('What am I facing?', 'tools.pre.facing', { rows: 2 }) +
      field('Where is the pressure coming from? (roles)', 'tools.pre.pressure', { type: 'text' }) +
      field('What am I tempted to do?', 'tools.pre.tempted', { rows: 2 }) +
      field('What would I be protecting?', 'tools.pre.protecting', { type: 'text' }) +
      promptCard('pre', '') +
      '<p class="small muted">Afterward, log the decision so it becomes part of your record.</p></section>';

    html += '<section class="card"><h2>Plan review (day 30, 60 or 90)</h2>' +
      (state.plan ? '<p>You are on day ' + planDay() + '. Your coach gets your full record: every check-in and every logged decision for this plan.</p>' + promptCard('review', '') +
        field('Paste the coach\'s review', 'tools.reviewReply', { rows: 5, placeholder: 'PLAN REVIEW: ...' }) +
        '<div class="btn-row"><button class="btn primary" data-action="save-review">Save review</button></div>'
        : '<p class="muted">Available once you have a 90 day plan.</p>') +
      (state.reviews.length ? '<h3>Saved reviews</h3>' + state.reviews.slice().reverse().map(function (r) {
        return '<details class="history-item"><summary>' + esc(fmtDate(r.date)) + ' &middot; day ' + r.day + '</summary><div class="reply">' + nl2br(r.text) + '</div></details>';
      }).join('') : '') + '</section>';

    html += '<section class="card"><h2>Your data</h2><p>Everything is stored privately in this browser on this device. Nothing is sent anywhere. If you clear your browser data or switch devices, restore from a backup file.</p>' +
      '<div class="btn-row wrap">' +
        '<button class="btn primary" data-action="export-pdf">Export to PDF</button>' +
        '<button class="btn" data-action="backup">Download backup</button>' +
        '<button class="btn" data-action="restore">Restore from backup</button>' +
      '</div>' +
      '<p class="small muted">Export to PDF opens your browser\'s print screen. Choose "Save as PDF" as the destination.</p>' +
      '<div class="field"><label for="ck_days">Check-in every</label><select id="ck_days" data-action="set-checkin-days">' +
        [7, 14].map(function (n) { return '<option value="' + n + '"' + (state.settings.checkinDays === n ? ' selected' : '') + '>' + n + ' days</option>'; }).join('') + '</select></div>' +
      '<div class="btn-row"><button class="btn danger" data-action="erase">Erase everything on this device</button></div></section>';

    html += '<section class="card"><h2>The five breaking points</h2>' + bpReference() + '</section>';

    html += '<section class="card"><h2>About</h2><p>' + esc(C.book.appName) + ' is a free companion to <em>' + esc(C.book.title) + '</em> by ' + esc(C.book.author) + '. It does not call any AI service. It builds prompts you use in your own Claude account.</p>' +
      '<p class="small muted">Your coach is not a therapist. If you are dealing with serious personal distress, talk with a qualified professional or someone you trust.</p></section>';
    return html;
  }

  function viewNotFound() {
    return pageHead('', 'Page not found', '') + '<div class="btn-row"><a class="btn primary" href="#/home">Go home</a></div>';
  }

  /* ---------- PDF report ---------- */

  function buildReport() {
    var p = state.prologue, r = '';
    r += '<h1>' + esc(C.book.appName) + '</h1><p class="muted">Companion to ' + esc(C.book.title) + ' by ' + esc(C.book.author) + ' &middot; Exported ' + esc(fmtDate(todayISO())) + '</p>';
    r += '<h2>My breaking point</h2>' + (has(p.sentence) ? '<blockquote>' + esc(p.sentence) + '</blockquote><p>Matched: ' + esc(bpNames(p.breakingPoints) || 'none') + '</p>' + (has(p.evidence) ? '<p>Evidence: ' + esc(p.evidence) + '</p>' : '') : '<p>Not written yet.</p>');

    r += '<h2>90 day plan</h2>';
    if (state.plan) {
      r += '<p>Started ' + esc(fmtDate(state.plan.startDate)) + ', day ' + planDay() + ' of ' + PLAN_DAYS + '.</p><ol>' + state.plan.commitments.map(function (c) {
        var s = commitmentStats(c.id);
        return '<li><strong>' + esc(c.what) + '</strong><br>Measure: ' + esc(c.measure) + '<br>Who can tell me if I slip: ' + esc(c.who) +
          '<br>Check-ins: ' + s.kept + ' kept, ' + s.mixed + ' mixed, ' + s.slipped + ' slipped. Log: ' + s.logKept + ' kept, ' + s.logSlips + ' slips.</li>';
      }).join('') + '</ol>';
    } else r += '<p>No active plan.</p>';

    r += '<h2>Check-ins</h2>' + (state.checkins.length ? state.checkins.map(function (c) {
      return '<div class="entry"><h3>' + esc(fmtDate(c.date)) + '</h3>' + (has(c.slips) ? '<p>Slips reported: ' + esc(c.slips) + '</p>' : '') + (has(c.coachReply) ? '<div>' + nl2br(c.coachReply) + '</div>' : '') + '</div>';
    }).join('') : '<p>None yet.</p>');

    r += '<h2>Decision log</h2>' + (state.log.length ? state.log.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (e) {
      return '<div class="entry"><p>' + nl2br(logEntryText(e).replace(/\n  /g, '\n')) + '</p></div>';
    }).join('') : '<p>Nothing logged.</p>');

    r += '<h2>Chapter work</h2>';
    var any = false;
    C.chapters.forEach(function (c) {
      var s = state.chapters[String(c.id)];
      if (!s || !(has(s.assessmentSummary) || has(s.reflectionSummary))) return;
      any = true;
      r += '<div class="entry"><h3>Chapter ' + c.id + ': ' + esc(c.title) + '</h3>' +
        (has(s.assessmentSummary) ? '<p><strong>Self-assessment</strong><br>' + nl2br(s.assessmentSummary) + '</p>' : '') +
        (has(s.reflectionSummary) ? '<p><strong>Reflection</strong><br>' + nl2br(s.reflectionSummary) + '</p>' : '') + '</div>';
    });
    if (!any) r += '<p>No chapter summaries saved yet.</p>';

    if (state.reviews.length) r += '<h2>Plan reviews</h2>' + state.reviews.map(function (v) { return '<div class="entry"><h3>' + esc(fmtDate(v.date)) + ', day ' + v.day + '</h3><div>' + nl2br(v.text) + '</div></div>'; }).join('');
    return r;
  }

  /* ---------- Actions ---------- */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.top = '-1000px';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function download(filename, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  var actions = {
    'copy-prompt': function (el) {
      var text = buildPrompt(el.dataset.kind, el.dataset.arg);
      copyText(text).then(function (ok) {
        if (ok) { toast('Prompt copied. Paste it into a new Claude chat.'); el.textContent = 'Copied'; setTimeout(function () { el.textContent = 'Copy prompt'; }, 2000); }
        else { showPreview(el, text); toast('Copy was blocked. Select the text below and copy it.'); }
      });
    },
    'preview-prompt': function (el) {
      var pre = el.closest('.prompt-card').querySelector('.prompt-preview');
      if (!pre.hidden) { pre.hidden = true; el.textContent = 'Preview'; return; }
      showPreview(el, buildPrompt(el.dataset.kind, el.dataset.arg));
      el.textContent = 'Hide preview';
    },

    'prologue-read': function () { state.prologue.storyRead = true; save(); go('#/start/decisions'); },
    'add-regret': function () { if (state.prologue.decisions.length < MAX_REGRETS) state.prologue.decisions.push(emptyRegret()); save(); rerender(); },
    'remove-regret': function (el) {
      if (!confirm('Remove this decision?')) return;
      state.prologue.decisions.splice(+el.dataset.index, 1); save(); rerender();
    },
    'parse-prologue': function () {
      var f = parseFields(state.prologue.coachReply);
      var sentence = f['BREAKING POINT SENTENCE'] || '';
      if (!sentence) {
        var m = String(state.prologue.coachReply).match(/when [^.\n]+?,\s*i [^\n]+/i);
        if (m) sentence = m[0].trim();
      }
      if (sentence) state.prologue.sentence = sentence.replace(/^["“]|["”]$/g, '');
      var bps = parseBreakingPoints(f['MATCHED BREAKING POINTS'] || f['MATCHED BREAKING POINT'] || '');
      if (bps.length) state.prologue.breakingPoints = bps;
      if (f.EVIDENCE) state.prologue.evidence = f.EVIDENCE;
      save();
      toast(sentence ? 'Read your sentence. Check it below.' : 'Could not find the sentence. Type it below.');
      go('#/start/save');
    },
    'toggle-bp': function (el) {
      var list = state.prologue.breakingPoints, i = list.indexOf(el.value);
      if (el.checked && i < 0) list.push(el.value);
      if (!el.checked && i >= 0) list.splice(i, 1);
      save();
    },
    'save-sentence': function () {
      var s = String(state.prologue.sentence || '').trim();
      if (!s) { toast('Write your sentence first.'); return; }
      if (!/^when\b/i.test(s) && !confirm('Your sentence does not start with "When". Save it anyway?')) return;
      state.prologue.sentence = s;
      state.prologue.savedAt = new Date().toISOString();
      save();
      toast('Saved and pinned to Home.');
      go('#/chapters');
    },

    'chapter-read': function (el) { chapterState(el.dataset.id).storyRead = true; save(); go('#/chapter/' + el.dataset.id + '/assessment'); },
    'chapter-step-save': function (el) {
      var s = chapterState(el.dataset.id);
      if (!has(s[el.dataset.field])) { toast('Paste the coach\'s summary first.'); return; }
      save(); toast('Saved.');
      go('#/chapter/' + el.dataset.id + '/' + el.dataset.next);
    },
    'parse-plan': function (el) {
      var s = chapterState(el.dataset.id);
      var parsed = parsePlan(s.planText);
      if (!parsed.length) {
        toast('Could not find commitments. Fill them in below.');
        parsed = [{ what: '', measure: '', who: '' }];
      } else toast('Found ' + parsed.length + ' commitment' + (parsed.length > 1 ? 's' : '') + '. Check them below.');
      s.planDraft = parsed;
      save(); rerender();
    },
    'add-commitment': function (el) {
      var list = getPath(state, el.dataset.path);
      if (list.length < MAX_COMMITMENTS) list.push({ id: uid(), what: '', measure: '', who: '' });
      save(); rerender();
    },
    'remove-commitment': function (el) {
      var list = getPath(state, el.dataset.path);
      if (!confirm('Remove this commitment?')) return;
      list.splice(+el.dataset.index, 1); save(); rerender();
    },
    'activate-plan': function (el) {
      var s = chapterState(el.dataset.id);
      var list = (s.planDraft || []).filter(function (c) { return has(c.what); }).slice(0, MAX_COMMITMENTS);
      if (!list.length) { toast('Add at least one commitment.'); return; }
      if (list.some(function (c) { return !has(c.measure) || !has(c.who); }) &&
        !confirm('Some commitments have no measure or no one to tell you if you slip. Save anyway?')) return;
      if (state.plan) {
        if (!confirm('Replace your current plan (day ' + planDay() + ')? It will be kept under Past plans.')) return;
        archivePlan();
      }
      state.plan = {
        id: uid(), startDate: todayISO(), sourceChapter: +el.dataset.id, createdAt: new Date().toISOString(),
        commitments: list.map(function (c) { return { id: uid(), what: c.what.trim(), measure: (c.measure || '').trim(), who: (c.who || '').trim() }; })
      };
      s.planSaved = true; s.planDraft = null;
      state.checkinDraft = null;
      save();
      toast('Your 90 day plan starts today.');
      go('#/home');
    },
    'blank-plan': function () {
      state.plan = { id: uid(), startDate: todayISO(), sourceChapter: null, createdAt: new Date().toISOString(), commitments: [{ id: uid(), what: '', measure: '', who: '' }] };
      save(); rerender();
    },
    'end-plan': function () {
      if (!confirm('End this plan? It will move to Past plans. Your check-ins and log stay.')) return;
      archivePlan(); state.plan = null; state.checkinDraft = null; save(); rerender();
    },

    'save-log': function () {
      if (!has(logDraft.decided)) { toast('Describe the decision first.'); return; }
      if (!logDraft.date) logDraft.date = todayISO();
      if (logDraft.id) {
        state.log = state.log.map(function (e) { return e.id === logDraft.id ? logDraft : e; });
      } else {
        logDraft.id = uid();
        logDraft.createdAt = new Date().toISOString();
        state.log.push(logDraft);
      }
      logDraft = null;
      save(); toast('Decision logged.');
      go('#/log');
    },
    'delete-log': function (el) {
      if (!confirm('Delete this decision from your log?')) return;
      state.log = state.log.filter(function (e) { return e.id !== el.dataset.id; });
      logDraft = null; save(); go('#/log');
    },

    'rate': function (el) { state.checkinDraft.ratings[el.dataset.cid] = el.value; save(); },
    'save-checkin': function () {
      var d = state.checkinDraft;
      if (!has(d.coachReply) && !confirm('You have not pasted a coach summary. Save the check-in anyway?')) return;
      state.checkins.push({
        id: uid(), planId: state.plan.id, date: todayISO(),
        ratings: d.ratings, evidence: d.evidence, slips: d.slips, wins: d.wins, hardest: d.hardest, coachReply: d.coachReply
      });
      state.checkinDraft = null;
      save();
      toast('Check-in saved. Next one due ' + fmtDate(nextCheckinDue()) + '.');
      go('#/home');
    },
    'delete-checkin': function (el) {
      if (!confirm('Delete this check-in?')) return;
      state.checkins = state.checkins.filter(function (c) { return c.id !== el.dataset.id; });
      save(); rerender();
    },

    'save-review': function () {
      if (!has(state.tools.reviewReply)) { toast('Paste the coach\'s review first.'); return; }
      state.reviews.push({ id: uid(), date: todayISO(), day: planDay(), planId: state.plan && state.plan.id, text: state.tools.reviewReply });
      state.tools.reviewReply = '';
      save(); toast('Review saved.'); rerender();
    },
    'export-pdf': function () {
      document.getElementById('print-report').innerHTML = buildReport();
      setTimeout(function () { window.print(); }, 50);
    },
    'backup': function () {
      save();
      var payload = { app: 'breaking-point-accountability-coach', exportedAt: new Date().toISOString(), data: state };
      download('breaking-point-backup-' + todayISO() + '.json', JSON.stringify(payload, null, 2));
      toast('Backup downloaded. Keep it somewhere safe.');
    },
    'restore': function () { document.getElementById('restore-input').click(); },
    'erase': function () {
      if (!confirm('Erase everything saved on this device? This cannot be undone. Download a backup first if you want to keep your work.')) return;
      if (!confirm('Are you sure? All answers, plans, check-ins and your log will be deleted.')) return;
      state = defaultState(); save(); toast('Everything was erased.'); go('#/home');
    }
  };

  function archivePlan() {
    if (!state.plan) return;
    var p = JSON.parse(JSON.stringify(state.plan));
    p.endedAt = todayISO();
    state.pastPlans.push(p);
  }

  function showPreview(el, text) {
    var pre = el.closest('.prompt-card').querySelector('.prompt-preview');
    pre.value = text; pre.hidden = false;
    pre.focus(); pre.select();
  }

  document.getElementById('restore-input').addEventListener('change', function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var data = parsed && parsed.data ? parsed.data : parsed;
        if (!data || typeof data !== 'object' || !data.prologue) throw new Error('bad');
        if (!confirm('Restore this backup? It will replace everything currently saved on this device.')) return;
        state = merge(defaultState(), data);
        save(); toast('Backup restored.'); go('#/home');
      } catch (e) { toast('That file is not a valid backup.'); }
      ev.target.value = '';
    };
    reader.readAsText(file);
  });

  /* ---------- Events ---------- */

  var app = document.getElementById('app');

  app.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.bind) { setPath(state, t.dataset.bind, t.value); saveSoon(); }
    else if (t.dataset.draft && logDraft) { logDraft[t.dataset.draft] = t.value; }
  });

  app.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.dataset.draft && logDraft) { logDraft[t.dataset.draft] = t.value; return; }
    if (t.dataset.bind) {
      setPath(state, t.dataset.bind, t.value); save();
      if (t.type === 'date') rerender();
      return;
    }
    if (t.dataset.action === 'set-checkin-days') { state.settings.checkinDays = +t.value; save(); toast('Check-ins every ' + t.value + ' days.'); return; }
    if (t.dataset.action && actions[t.dataset.action]) actions[t.dataset.action](t);
  });

  app.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-action]');
    if (!el || !app.contains(el)) return;
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
    var fn = actions[el.dataset.action];
    if (!fn) return;
    ev.preventDefault();
    if (saveTimer) save();
    fn(el);
  });

  /* ---------- Router ---------- */

  function route() {
    var parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
    return { name: parts[0] || 'home', a: parts[1], b: parts[2] };
  }

  function render() {
    var r = route();
    var html;
    if (r.name !== 'log' || (r.a !== 'new' && r.a !== 'edit')) logDraft = null;
    switch (r.name) {
      case 'home': html = viewHome(); break;
      case 'start': html = viewPrologue(r.a); break;
      case 'chapters': html = viewChapters(); break;
      case 'chapter': html = viewChapter(r.a, r.b); break;
      case 'plan': html = viewPlan(); break;
      case 'log': html = r.a === 'new' ? viewLogForm(null) : r.a === 'edit' ? viewLogForm(r.b) : viewLog(); break;
      case 'checkin': html = viewCheckin(r.a); break;
      case 'tools': html = viewTools(); break;
      default: html = viewNotFound();
    }
    app.innerHTML = html;
    var navKey = { start: 'chapters', chapter: 'chapters', plan: 'home' }[r.name] || r.name;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.getElementById('storage-warning').hidden = storageOk;
  }

  window.addEventListener('hashchange', function () {
    if (saveTimer) save();
    render();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  });

  window.addEventListener('beforeprint', function () {
    var el = document.getElementById('print-report');
    if (!el.innerHTML) el.innerHTML = buildReport();
  });
  window.addEventListener('afterprint', function () { document.getElementById('print-report').innerHTML = ''; });

  // Exposed for testing only.
  window.__bpac = { parsePlan: parsePlan, parseFields: parseFields, parseBreakingPoints: parseBreakingPoints, buildPrompt: buildPrompt, getState: function () { return state; } };

  render();
})();
