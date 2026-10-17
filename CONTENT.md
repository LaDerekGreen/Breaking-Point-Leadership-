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
  assessmentQuestion: '...',         // the chapter's specific self-assessment question
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

## Current placeholders

Reflection questions for the prologue and chapters 1 through 5 are the book's text. Chapters 1 through 5 still use draft assessment questions and action steps written from the themes, so they keep `placeholder: true` until those are replaced. Chapter 5 (Grace) also has a draft story summary.

## Writing rule

The coach is told to use no dashes and never the word "just". Keep the content in `content.js` to the same rule so the prompts stay consistent.

## Coach instructions

`coachInstructions` at the top of `content.js` is placed at the top of every generated prompt. Edit it there and every prompt updates.
