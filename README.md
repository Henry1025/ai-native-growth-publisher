# AI Native Growth

Static monthly news brief generator.

## How it works

- `content/articles.json` stores the issue metadata and article list.
- `templates/index.template.html` stores the fixed page structure.
- `styles.css` stores the visual style.
- `generate.js` renders `index.html`.
- `.github/workflows/pages.yml` can deploy the site to GitHub Pages automatically.

## Update an issue

Edit `content/articles.json`.

Each article uses this shape:

```json
{
  "source": "TechCrunch",
  "title": "Article title",
  "summary": "Use the exact editorial summary provided by the editor.",
  "url": "https://example.com/article",
  "image": "assets/example.jpg",
  "imageAlt": "Short image description",
  "readTime": "2 MIN READ"
}
```

Then run:

```bash
npm run generate
```

Open `index.html` to preview.

## Deploy with GitHub Pages

1. Create a GitHub repository.
2. Push this project to the repository.
3. In GitHub, open `Settings -> Pages`.
4. Set source to `GitHub Actions`.
5. Push changes to `main` or `master`.
6. GitHub Actions will run `node generate.js` and deploy the site.

## Deploy with Cloudflare Pages

1. Create a free Cloudflare account.
2. Push this project to GitHub.
3. In Cloudflare Pages, choose `Connect to Git`.
4. Select the repository.
5. Framework preset: `None`.
6. Build command: `npm run generate`.
7. Output directory: `/`.
8. Deploy and use the generated `pages.dev` URL.

## Future workflow

For a new issue, provide:

```text
Issue: 6月总结
Date: Monday, July 1, 2026

News 1:
Source:
Title:
Summary:
URL:
Image: optional
Read time:
```

The template can stay unchanged while `content/articles.json` changes.
