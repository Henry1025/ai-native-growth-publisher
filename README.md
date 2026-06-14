# AI Native Growth

Static monthly news brief publisher.

The project turns a simple editor-friendly Markdown inbox into a newspaper-style static website, then publishes it with GitHub Pages.

## One-click workflow

Edit:

```text
content/inbox.md
```

Then run:

```bash
npm run publish
```

That command will:

1. Parse `content/inbox.md`.
2. Generate `content/articles.json`.
3. Render `index.html`.
4. Commit the issue changes.
5. Push to GitHub.
6. Let GitHub Actions publish the site to the `gh-pages` branch.

Use this for a local dry run without Git:

```bash
npm run publish:dry
```

## Input Format

Use one top metadata block, then one `## Source | Title` block per story:

```md
# AI Native Growth

Issue: 6月总结
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

- `content/inbox.md`: editor-facing input
- `scripts/import-news.js`: converts inbox Markdown to JSON
- `content/articles.json`: generated structured content
- `templates/index.template.html`: fixed page structure
- `styles.css`: visual style
- `generate.js`: renders `index.html`
- `scripts/publish.js`: one-command import, generate, commit, push
- `.github/workflows/pages.yml`: publishes generated static files to `gh-pages`

## Public URL

https://henry1025.github.io/ai-native-growth---/

## Notes

The editor summary is treated as the source of truth. The importer does not rewrite or invent article analysis.
