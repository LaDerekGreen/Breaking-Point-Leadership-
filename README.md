# Breaking Point Accountability Coach

A free companion web app to the book **Breaking Point Leadership** by LaDerek Green.
Readers find their leadership breaking point, then build and keep a 90-day development plan, chapter by chapter, with an AI accountability coach.

## How it works

* **No AI costs.** The app never calls an AI service. For each step it builds a complete coaching prompt (coach instructions, the chapter's story and questions, and the reader's own saved answers). The reader taps **Copy prompt**, pastes it into their own free Claude account, has the conversation there, and pastes the coach's final block back into the app.
* **Structured paste back.** Every prompt asks the coach to finish with a labeled block (for example `BREAKING POINT SENTENCE:` or `COMMITMENT 1:` / `MEASURE:` / `WHO:`). The app reads those labels to fill in the sentence, matched breaking points and plan commitments automatically. The reader can always edit the result.
* **No account, no login, no payment.** All data lives in the browser's local storage on the reader's device. Tools offers **Export to PDF** (via the browser's Save as PDF), **Download backup** (a JSON file) and **Restore from backup**.

## What's in the app

| Screen | What it does |
| --- | --- |
| Home | Pinned breaking point sentence, the active 90-day plan (up to 3 commitments) with kept / mixed / slipped counts, next check-in due date, and the four main buttons. |
| Start: The Letter | Prologue (Calvin Brooks). Up to 3 regretted decisions, 4 reflection questions, a coach prompt to find the pattern and write "When ___, I ___.", then save and pin the sentence and matched breaking points. |
| Chapters | Five modules, matched chapters recommended first. Each has Story, Self-Assessment, Reflection and Action Plan steps, plus the book's action step. |
| Log a Decision | The record the coach checks claims against: what was decided, the pressure, what was protected, who paid, which commitment it relates to, and kept / slipped. |
| Weekly Check-In | The reader rates each commitment and reports slips first. The prompt then includes the decision log and a "record check" that flags any commitment rated Kept while the log shows slips, so the coach can name unreported slips plainly. |
| Tools | "Before a hard decision" prompt, Plan review (day 30, 60, 90) prompt, PDF export, backup and restore, check-in frequency, the five breaking points reference, erase all data. |

## Files

* `index.html`: page shell and navigation
* `content.js`: **all book content** (coach instructions, breaking points, prologue, chapters). See [CONTENT.md](CONTENT.md).
* `app.js`: app logic, prompt builders, storage
* `styles.css`: styles, including dark mode and the PDF print layout

No build step and no dependencies.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

(Copy to clipboard works best over `http://localhost` or `https://`.)

## Publish for free with GitHub Pages

1. In the repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
3. The app will be live at `https://<your-username>.github.io/<repository-name>/` within a minute or two.

Any static host (Netlify, Cloudflare Pages, Vercel) also works: upload the folder as is.

## Privacy

The app has no server and collects nothing. Readers' answers never leave their device unless they copy a prompt into Claude themselves or download a backup.
