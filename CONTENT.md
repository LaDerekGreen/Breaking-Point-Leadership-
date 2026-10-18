# Editing the book content

Everything the reader sees from the book lives in **`content.js`**. You can edit it in any text editor or directly on GitHub (open the file, click the pencil icon, edit, commit).

## Chapter modules

Each chapter looks like this:

```js
{
  id: 1,
  breakingPoint: 'comfort',          // one of: comfort, convenience, trust, standing, self
  title: 'Comfort',
  leader: 'Marcus',
  summary: 'Marcus votes fairly in one blind review, then ...',
  focus: 'Who I sponsor and who I overlook.',
  assessmentQuestion: '...',         // the chapter's self-assessment question for the coach
  assessmentChecklist: [ '...' ],    // the book's yes or no self-assessment list
  reflectionCoach: '...',            // the book's extra instruction for the reflection coach
  reflectionQuestions: [             // the coach asks these one at a time
    'Question one?',
    'Question two?'
  ],
  actionStep: '...',                 // the book's action step
  placeholder: true                  // set to false once the text is final
}
```

To drop in the book's exact text:

1. Replace `reflectionQuestions` with the chapter's questions (add or remove lines as needed; each line is wrapped in quotes and ends with a comma).
2. Replace `actionStep` with the book's action step.
3. Update `assessmentQuestion`, `summary` or `focus` if you like.
4. Change `placeholder: true` to `placeholder: false`. This removes the "Draft content" notice for that chapter.

**Apostrophes:** text is wrapped in single quotes, so write an apostrophe as `\'` (for example `'Devon\'s openness'`), or wrap that text in double quotes instead.

## Closing section

`closing` in `content.js` is "Leading the Leader Who Broke", shown as the last card on the Chapters screen. It holds that section's reflection questions and action step.

## Workbook and epilogue

`workbook` in `content.js` holds the nine exercises from The Breaking Point Workbook. Each exercise has `body` and `after` paragraphs, an optional `list`, and `fields` the reader fills in (each with a `key` and `label`). Do not change a field's `key` once readers have used it, or their saved answers will no longer show.

`epilogue` holds the full text of One Year Later, as `sections` with a `heading` and `paragraphs`.

## Reading pages

`pages` in `content.js` holds Before the System Arrives, A Letter to the Reader and the Glossary. Each page has `sections`, and each section has a `heading` and `paragraphs`. They show as the M, L and G cards on the Chapters screen. The prologue's action step is `prologue.actionStep`.

## Source

All chapter text was taken from the book manuscript "Publish V3 Final 19:03: Breaking Point Leadership - Book Draft" in Google Drive. No chapter is marked as a placeholder.

## Writing rule

The coach is told to use no dashes and never the word "just". Keep the content in `content.js` to the same rule so the prompts stay consistent.

## Coach instructions

`coachInstructions` at the top of `content.js` is placed at the top of every generated prompt. Edit it there and every prompt updates.
