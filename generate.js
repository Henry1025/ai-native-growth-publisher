const fs = require("fs");
const path = require("path");

const root = __dirname;
const contentPath = path.join(root, "content", "articles.json");
const templatePath = path.join(root, "templates", "index.template.html");
const outputPath = path.join(root, "index.html");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function articleCard(article) {
  return `          <a
            class="story-card"
            href="${escapeHtml(article.url)}"
            rel="noreferrer"
          >
            <span class="story-copy">
              <span class="story-source">${escapeHtml(article.source)}</span>
              <strong>${escapeHtml(article.title)}</strong>
              <small>${escapeHtml(article.summary)}</small>
              <span class="read-time">${escapeHtml(article.readTime)}</span>
            </span>
            <img
              class="story-thumb"
              src="${escapeHtml(article.image)}"
              alt="${escapeHtml(article.imageAlt)}"
            />
          </a>`;
}

function render() {
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const template = fs.readFileSync(templatePath, "utf8");
  const articleCards = content.articles.map(articleCard).join("\n");
  const documentTitle = `${content.siteTitle} - ${content.issue}`;

  const html = template
    .replaceAll("{{documentTitle}}", escapeHtml(documentTitle))
    .replaceAll("{{description}}", escapeHtml(content.description))
    .replaceAll("{{date}}", escapeHtml(content.date))
    .replaceAll("{{category}}", escapeHtml(content.category))
    .replaceAll("{{siteTitle}}", escapeHtml(content.siteTitle))
    .replaceAll("{{eyebrow}}", escapeHtml(content.eyebrow))
    .replaceAll("{{issue}}", escapeHtml(content.issue))
    .replaceAll("{{sectionTitle}}", escapeHtml(content.sectionTitle))
    .replaceAll("{{articleCards}}", articleCards)
    .replaceAll("{{footer}}", escapeHtml(content.footer));

  fs.writeFileSync(outputPath, html, "utf8");
}

render();
