# AI Native Growth

Static monthly news brief publisher with issue archives.

The project turns `content/inbox.md` into a newspaper-style website, keeps every issue under its own permanent URL, and publishes everything with GitHub Pages.

## What Gets Published

- Home page: latest issue
- Archive pages: one permanent page per issue

Example URLs:

```text
https://henry1025.github.io/ai-native-growth---/
https://henry1025.github.io/ai-native-growth---/issues/2026-05/
https://henry1025.github.io/ai-native-growth---/issues/2026-06/
```

## Everyday Workflow

Edit:

```text
content/inbox.md
```

Preview locally without publishing:

```bash
npm run publish:dry
```

Publish when it looks right:

```bash
npm run publish
```

That command will:

1. Parse `content/inbox.md`.
2. Generate `content/articles.json`.
3. Save a historical JSON copy under `content/issues/{slug}.json`.
4. Render the latest homepage at `index.html`.
5. Render the permanent issue page under `issues/{slug}/index.html`.
6. Commit and push the changes.
7. Let GitHub Actions publish the site to the `gh-pages` branch.

## Input Format

Use one top metadata block, then one `## Source | Title` block per story.

```md
# AI Native Growth

Issue: 6月总结
Slug: 2026-06
Date: Monday, July 1, 2026
Category: Technology / Business
Eyebrow: News Overview
Section: 本月新闻
Description: AI native growth monthly news brief.

## TechCrunch | Example story title
URL: https://example.com/article
Summary: Use the exact editorial summary provided by the editor.
Image: assets/example.jpg
Image Alt: Short image description
Read Time: 2 MIN READ
```

Important:

- `Slug` controls the permanent archive URL.
- Use `2026-06`, `2026-07`, etc. for monthly issues.
- The editor summary is treated as the source of truth. The importer does not rewrite or invent article analysis.

Required article fields:

- `Title` from the heading or `Title:`
- `Source` from the heading or `Source:`
- `URL`
- `Summary`

Optional article fields:

- `Image`
- `Image Alt`
- `Read Time`

## Project Structure

```text
content/
  inbox.md              # Editor-facing input
  articles.json         # Latest issue, generated
  issues/
    2026-05.json        # Historical issue data

issues/
  2026-05/
    index.html          # Historical issue page

scripts/
  import-news.js        # Inbox Markdown -> JSON + archive JSON
  publish.js            # Import, generate, commit, push

templates/
  index.template.html   # HTML template

assets/                 # News images
styles.css              # Visual style
generate.js             # JSON + template -> HTML pages
index.html              # Latest issue page
```

## Public URL

https://henry1025.github.io/ai-native-growth---/
